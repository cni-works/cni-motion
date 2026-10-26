const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const settings = read('includes/class-settings.php');
const tools = read('includes/class-block-tools.php');
const attributes = read('includes/class-block-attributes.php');
const editor = read('assets/js/editor.js');
const preview = read('assets/js/custom-css-preview.js');
const assets = read('includes/class-assets.php');
const view = read('includes/views/settings-page.php');
const previewContext = { window: {} };
vm.runInNewContext(preview, previewContext);
const compilePreview = previewContext.window.CNIMotionCustomCssPreviewAPI.compile;

test('module schema defaults new features to off and advances settings schema', () => {
	assert.match(settings, /SCHEMA_VERSION = 3/);
	assert.match(settings, /'modules'\s*=>\s*array\( 'customCss' => false, 'visibility' => false \)/);
	assert.match(settings, /'customCss' => ! empty\( \$modules\['customCss'\] \)/);
	assert.match(settings, /'visibility' => ! empty\( \$modules\['visibility'\] \)/);
});

test('data-preserving attributes are always in the shared schema', () => {
	assert.match(attributes, /'cniCustomCss'\s*=>\s*array\( 'type' => 'string', 'default' => '' \)/);
	assert.match(attributes, /'cniCssId'\s*=>\s*array\( 'type' => 'string', 'default' => '' \)/);
	assert.match(attributes, /'cniVisibility'\s*=>\s*array\( 'type' => 'string', 'default' => 'all' \)/);
	assert.match(attributes, /Block_Tools::supports_custom_css/);
	assert.match(attributes, /Block_Tools::supports_visibility/);
});

test('custom CSS and visibility use separate support decisions with structural exclusions', () => {
	assert.match(tools, /supports_custom_css/);
	assert.match(tools, /supports_visibility/);
	assert.match(tools, /cni_motion_custom_css_support/);
	assert.match(tools, /cni_motion_visibility_support/);
	for (const block of ['core/block','core/html','core/navigation','core/post-template','core/query','core/shortcode','core/template-part']) assert.match(tools, new RegExp(block.replace('/','\\/')));
});

test('visibility is opt-in, server rendered, allow-listed and skipped in editors', () => {
	assert.match(tools, /empty\( \$settings\['modules'\]\['visibility'\] \)/);
	assert.match(tools, /is_admin\(\)/);
	assert.match(tools, /wp_is_json_request/);
	assert.match(tools, /is_user_logged_in\(\)/);
	assert.match(tools, /return ''/);
	assert.match(attributes, /Block_Tools::apply_visibility/);
	assert.match(editor, /CNI Block Settings/);
	assert.match(editor, /cniVisibility/);
});

test('custom CSS is opt-in, permission gated and keeps its visible starter template out of saved defaults', () => {
	assert.match(assets, /current_user_can\( 'unfiltered_html' \)/);
	assert.match(view, /modules\]\[customCss\]/);
	assert.match(editor, /TextareaControl/);
	assert.match(editor, /emptyCustomCssTemplate = 'selector \{\\n\\n\\n\}'/);
	assert.match(editor, /value:a\.cniCustomCss\s*\|\|\s*emptyCustomCssTemplate/);
	assert.match(editor, /function isEmptyCustomCss/);
	assert.match(editor, /updates=\{cniCustomCss:empty\?'':value\}/);
	assert.match(editor, /if\(empty\)updates\.cniCssId=''/);
});

test('responsive templates copy without mutating the custom CSS attribute', () => {
	assert.match(editor, /selector:'selector \{\\n\\n\}'/);
	assert.match(editor, /max-width: 480px/);
	assert.match(editor, /min-width: 481px/);
	assert.match(editor, /max-width: 959px/);
	assert.match(editor, /min-width: 960px/);
	assert.match(editor, /navigator\.clipboard\.writeText/);
	assert.match(editor, /selectorをコピー/);
	assert.match(editor, /スマホ用をコピー/);
	assert.match(editor, /タブレット用をコピー/);
	assert.match(editor, /PC用をコピー/);
	assert.match(editor, /コピー後、Custom CSS欄の必要な位置へ貼り付けて編集してください/);
});

test('CNI inspector panels register early and keep Motion and Block Settings near the top', () => {
	assert.match(editor, /addFilter\('editor\.BlockEdit','cni-motion\/inspector',[\s\S]*,1\);/);
	assert.match(editor, /basicControls\),blockToolsPanel\(props\),enabled && el\(PanelBody/);
	assert.match(editor, /return el\(Fragment,null,el\(InspectorControls[\s\S]*\),el\(BlockEdit,props\),customCssPreview\);/);
});

test('custom CSS output is server scoped and does not use an Otter compatibility path', () => {
	assert.match(tools, /apply_custom_css/);
	assert.match(tools, /compile_custom_css/);
	assert.match(tools, /WP_HTML_Tag_Processor/);
	assert.match(tools, /cni-block-\[a-z0-9\]/);
	assert.match(tools, /@\\s\*\(\?:import\|font-face\|namespace\|keyframes\)/);
	assert.doesNotMatch(tools + attributes + editor + preview + assets, /ticss-|hasCustomCSS|otter[_-].*compat/i);
});

test('selected block receives a scoped live preview in its own editor document', () => {
	assert.match(assets, /cni-motion-custom-css-preview/);
	assert.match(editor, /function CustomCssPreview/);
	assert.match(editor, /props\.isSelected/);
	assert.match(editor, /findBlockNode\(props\.clientId\)/);
	assert.match(editor, /node\.ownerDocument/);
	assert.match(editor, /doc\.head\.appendChild\(style\)/);
	assert.match(editor, /style\.parentNode\.removeChild\(style\)/);
	assert.match(editor, /node\.classList\.remove\(cssId\)/);
	assert.match(preview, /CNIMotionCustomCssPreviewAPI/);
	assert.match(preview, /@\\s\*\(\?:import\|font-face\|namespace\|keyframes\)/);
});

test('editor preview compiler accepts the public syntax and rejects unsafe scope escapes', () => {
	const scope = '.cni-block-a1b2c3d4';
	assert.equal(compilePreview('selector { color:red; }', scope), scope + '{color:red;}');
	assert.equal(compilePreview('selector:hover, selector > .child { opacity:.8; }', scope), scope + ':hover,' + scope + ' > .child{opacity:.8;}');
	assert.equal(compilePreview('selector img { display:block; }', scope), scope + ' img{display:block;}');
	assert.equal(compilePreview('@media (max-width: 767px) { selector { padding:10px; } }', scope), '@media (max-width: 767px){' + scope + '{padding:10px;}}');
	assert.equal(compilePreview('body { color:red; }', scope), null);
	assert.equal(compilePreview('selector + .other { color:red; }', scope), null);
	assert.equal(compilePreview('@import url(example.css);', scope), null);
});
