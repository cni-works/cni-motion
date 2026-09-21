(function (wp) {
	'use strict';
	if (!wp || !wp.richText || !wp.blockEditor || !wp.components || !wp.element) return;

	var registerFormatType = wp.richText.registerFormatType;
	var applyFormat = wp.richText.applyFormat;
	var removeFormat = wp.richText.removeFormat;
	var RichTextToolbarButton = wp.blockEditor.RichTextToolbarButton;
	var el = wp.element.createElement;
	var Fragment = wp.element.Fragment;
	var useState = wp.element.useState;
	var useEffect = wp.element.useEffect;
	var useSelect = wp.data && wp.data.useSelect;
	var __ = wp.i18n.__;
	var Popover = wp.components.Popover;
	var Button = wp.components.Button;
	var SelectControl = wp.components.SelectControl;
	var TextControl = wp.components.TextControl;
	var RangeControl = wp.components.RangeControl;
	var PanelBody = wp.components.PanelBody;
	var data = window.CNIMotionTextData || {};
	var accents = Array.isArray(data.accents) ? data.accents.filter(function (accent) { return accent && typeof accent.slug === 'string'; }) : [];
	var supportedBlocks = Array.isArray(data.accentBlocks) ? data.accentBlocks : [];
	var textApi = window.CNIMotionTextAPI;
	var FORMAT_NAME = 'cni-motion/text-accent';
	var defaults = {
		accentStyle: 'marker',
		direction: 'left',
		color: '#fff176',
		color2: '#ffb74d',
		duration: '700',
		delay: '0',
		trigger: 'auto',
		thickness: '42',
		opacity: '65'
	};

	function resolveSelectedBlockName(select) {
		if (typeof select !== 'function') return '';
		var store = select('core/block-editor');
		if (!store) return '';
		var clientId = typeof store.getSelectedBlockClientId === 'function' ? store.getSelectedBlockClientId() : '';
		if (clientId && typeof store.getBlockName === 'function') {
			var name = store.getBlockName(clientId);
			if (name) return name;
		}
		var block = typeof store.getSelectedBlock === 'function' ? store.getSelectedBlock() : (clientId && typeof store.getBlock === 'function' ? store.getBlock(clientId) : null);
		return block && block.name ? block.name : '';
	}

	function selectedBlockName() {
		return resolveSelectedBlockName(wp.data && wp.data.select);
	}

	function useSelectedBlockName() {
		if (typeof useSelect !== 'function') return selectedBlockName();
		return useSelect(function (select) {
			return resolveSelectedBlockName(select);
		}, []);
	}

	function formatBlockName(props, selectedName) {
		var content = props && props.contentRef && props.contentRef.current;
		var block = content && typeof content.closest === 'function' ? content.closest('[data-type]') : null;
		return block && block.getAttribute('data-type') ? block.getAttribute('data-type') : selectedName;
	}

	function normalized(attributes) {
		return Object.assign({}, defaults, attributes || {});
	}

	function findSelectedBlockNode() {
		if (!wp.data || !wp.data.select) return null;
		var store = wp.data.select('core/block-editor');
		var clientId = store && typeof store.getSelectedBlockClientId === 'function' ? store.getSelectedBlockClientId() : '';
		if (!clientId) return null;
		var selector = '[data-block="' + String(clientId).replace(/"/g, '\\"') + '"]';
		var node = document.querySelector(selector);
		if (node) return node;
		var frames = document.querySelectorAll('iframe');
		for (var index = 0; index < frames.length; index++) {
			try {
				if (frames[index].contentDocument) {
					node = frames[index].contentDocument.querySelector(selector);
					if (node) return node;
				}
			} catch (ignore) {}
		}
		return null;
	}

	function nodeOptions(node) {
		return {
			style: node.dataset.cniAccentStyle,
			direction: node.dataset.cniAccentDirection,
			color: node.dataset.cniAccentColor,
			color2: node.dataset.cniAccentColor2,
			duration: node.dataset.cniAccentDuration,
			delay: node.dataset.cniAccentDelay,
			thickness: node.dataset.cniAccentThickness,
			opacity: node.dataset.cniAccentOpacity
		};
	}

	function refreshEditorStyles() {
		if (!textApi || typeof textApi.styleAccent !== 'function') return;
		var block = findSelectedBlockNode();
		if (!block) return;
		block.querySelectorAll('.cni-text-accent').forEach(function (node) { textApi.styleAccent(node, nodeOptions(node)); });
	}

	function replay() {
		if (!textApi || typeof textApi.accent !== 'function') return;
		var block = findSelectedBlockNode();
		if (!block) return;
		block.querySelectorAll('.cni-text-accent').forEach(function (node) {
			if (node.cniTextAccentEditorCleanup) node.cniTextAccentEditorCleanup();
			var instance = textApi.accent(node, nodeOptions(node));
			if (!instance) return;
			node.cniTextAccentEditorCleanup = instance.cleanup;
			var view = node.ownerDocument.defaultView || window;
			view.setTimeout(function () {
				if (node.cniTextAccentEditorCleanup === instance.cleanup) {
					instance.cleanup();
					textApi.styleAccent(node, nodeOptions(node));
					node.cniTextAccentEditorCleanup = null;
				}
			}, parseInt(node.dataset.cniAccentDuration || '700', 10) + parseInt(node.dataset.cniAccentDelay || '0', 10) + 300);
		});
	}

	function Edit(props) {
		var openState = useState(false);
		var open = openState[0];
		var setOpen = openState[1];
		var blockName = formatBlockName(props, useSelectedBlockName());
		useEffect(function () {
			if (!props.isActive) return;
			var frame = window.requestAnimationFrame(refreshEditorStyles);
			return function () { window.cancelAnimationFrame(frame); };
		}, [props.isActive, props.activeAttributes]);
		if (supportedBlocks.indexOf(blockName) === -1) return null;
		var attributes = normalized(props.activeAttributes);

		function update(changes) {
			props.onChange(applyFormat(props.value, { type: FORMAT_NAME, attributes: Object.assign({}, attributes, changes) }));
		}

		function activate() {
			if (!props.isActive) props.onChange(applyFormat(props.value, { type: FORMAT_NAME, attributes: attributes }));
			setOpen(true);
		}

		function remove() {
			props.onChange(removeFormat(props.value, FORMAT_NAME));
			setOpen(false);
		}

		var styleOptions = accents.map(function (accent) { return { label: accent.label, value: accent.slug }; });
		return el(Fragment, null,
			el(RichTextToolbarButton, {
				icon: 'editor-underline',
				title: __('文字アクセント', 'cni-motion'),
				isActive: props.isActive,
				onClick: function () { if (props.isActive) setOpen(!open); else activate(); }
			}),
			props.isActive && open && el(Popover, { className: 'cni-text-accent-popover', placement: 'bottom-start', offset: 8, onClose: function () { setOpen(false); }, focusOnMount: false },
				el('div', { className: 'cni-text-accent-popover__content' },
					el('div', { className: 'cni-text-accent-popover__grid' },
						el(SelectControl, { label: __('スタイル', 'cni-motion'), value: attributes.accentStyle, options: styleOptions, onChange: function (value) {
							var definition = accents.find(function (accent) { return accent.slug === value; });
							update({ accentStyle: value, thickness: String(definition ? definition.defaultThickness : 42) });
						} }),
						el(SelectControl, { label: __('描画方向', 'cni-motion'), value: attributes.direction, options: [
							{ label: __('左から', 'cni-motion'), value: 'left' },
							{ label: __('右から', 'cni-motion'), value: 'right' }
						], onChange: function (value) { update({ direction: value }); } }),
						el(TextControl, { label: __('色1', 'cni-motion'), type: 'color', value: attributes.color, onChange: function (value) { update({ color: value }); } }),
						attributes.accentStyle === 'gradient-marker' && el(TextControl, { label: __('色2', 'cni-motion'), type: 'color', value: attributes.color2, onChange: function (value) { update({ color2: value }); } })
					),
					el(PanelBody, { title: __('詳細設定', 'cni-motion'), initialOpen: false, className: 'cni-text-accent-popover__details' },
						el('div', { className: 'cni-text-accent-popover__details-grid' },
							el(RangeControl, { label: __('太さ (%)', 'cni-motion'), value: parseInt(attributes.thickness, 10), min: 5, max: 80, step: 1, onChange: function (value) { update({ thickness: String(value) }); } }),
							el(RangeControl, { label: __('透明度 (%)', 'cni-motion'), value: parseInt(attributes.opacity, 10), min: 10, max: 100, step: 5, onChange: function (value) { update({ opacity: String(value) }); } }),
							el(RangeControl, { label: __('時間 (ms)', 'cni-motion'), value: parseInt(attributes.duration, 10), min: 100, max: 3000, step: 50, onChange: function (value) { update({ duration: String(value) }); } }),
							el(RangeControl, { label: __('遅延 (ms)', 'cni-motion'), value: parseInt(attributes.delay, 10), min: 0, max: 5000, step: 50, onChange: function (value) { update({ delay: String(value) }); } }),
							el(SelectControl, { label: __('発火', 'cni-motion'), value: attributes.trigger, options: [
								{ label: __('自動', 'cni-motion'), value: 'auto' },
								{ label: __('Site Ready', 'cni-motion'), value: 'site-ready' },
								{ label: __('スクロール', 'cni-motion'), value: 'scroll' },
								{ label: __('即時', 'cni-motion'), value: 'immediate' }
							], onChange: function (value) { update({ trigger: value }); } })
						)
					),
					el('div', { className: 'cni-text-accent-popover__actions' },
						el(Button, { variant: 'secondary', onClick: replay }, __('再生', 'cni-motion')),
						el(Button, { variant: 'tertiary', isDestructive: true, onClick: remove }, __('解除', 'cni-motion'))
					)
				)
			)
		);
	}

	if (!accents.length || !supportedBlocks.length) return;
	registerFormatType(FORMAT_NAME, {
		title: __('文字アクセント', 'cni-motion'),
		tagName: 'span',
		className: 'cni-text-accent',
		attributes: {
			accentStyle: 'data-cni-accent-style',
			direction: 'data-cni-accent-direction',
			color: 'data-cni-accent-color',
			color2: 'data-cni-accent-color-2',
			duration: 'data-cni-accent-duration',
			delay: 'data-cni-accent-delay',
			trigger: 'data-cni-accent-trigger',
			thickness: 'data-cni-accent-thickness',
			opacity: 'data-cni-accent-opacity'
		},
		edit: Edit
	});
}(window.wp));
