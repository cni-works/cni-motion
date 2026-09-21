(function (wp) {
	'use strict';

	function ready(callback) {
		if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', callback, {once:true});
		else callback();
	}

	ready(function () {
		var __ = wp && wp.i18n ? wp.i18n.__ : function (text) { return text; };
		var config = window.CNIMotionLoaderAdmin || {};
		var previewController = null;
		var previewRootHadReducedClass = false;

		function input(name) {
			return document.querySelector('[name="cni_motion_settings[loader][' + name + ']"]');
		}
		function value(name, fallback) {
			var field = input(name);
			return !field || field.value === '' ? fallback : field.value;
		}
		function integer(name, fallback) {
			var parsed = parseInt(value(name, fallback), 10);
			return Number.isFinite(parsed) ? parsed : fallback;
		}
		function decimal(name, fallback) {
			var parsed = parseFloat(value(name, fallback));
			return Number.isFinite(parsed) ? parsed : fallback;
		}
		function emit(field, eventName) {
			field.dispatchEvent(new Event(eventName, {bubbles:true}));
		}
		function setField(name, next) {
			var field = input(name);
			if (!field) return;
			field.value = String(next);
			emit(field, 'input');
			emit(field, 'change');
		}

		function contentNode(type) {
			var node;
			if (type === 'site-title') {
				if (!config.siteTitle) return null;
				node = document.createElement('p');
				node.className = 'cni-loader__text cni-loader__site-title';
				node.textContent = config.siteTitle;
				return node;
			}
			if (type === 'site-logo' || type === 'custom-image') {
				var preview = document.getElementById('cni-image-preview');
				var imageUrl = config.customImageUrl || (preview ? preview.getAttribute('src') : '');
				if (!imageUrl) return contentNode('site-title');
				node = document.createElement('img');
				node.className = 'cni-loader__image';
				node.src = imageUrl;
				node.alt = '';
				return node;
			}
			if (type === 'custom-text') {
				node = document.createElement('p');
				node.className = 'cni-loader__text';
				node.textContent = value('customText', '');
				return node;
			}
			if (type === 'line') {
				node = document.createElement('span');
				node.className = 'cni-loader__line';
				return node;
			}
			if (type === 'dots') {
				node = document.createElement('span');
				node.className = 'cni-loader__dots';
				for (var index = 0; index < 3; index += 1) node.appendChild(document.createElement('i'));
				return node;
			}
			return null;
		}

		function contentLayoutNode(layout) {
			if (layout === 'single') return contentNode(value('contentType', 'custom-image'));
			var stack = document.createElement('div');
			stack.className = 'cni-loader__stack';
			var logo = contentNode('custom-image');
			if (logo) stack.appendChild(logo);
			if (layout === 'logo-text' || layout === 'logo-text-line') {
				var text = contentNode('custom-text');
				if (text) {
					text.classList.add('cni-loader__site-title', 'cni-loader__brand-text');
					stack.appendChild(text);
				}
			}
			if (layout === 'logo-line' || layout === 'logo-text-line') stack.appendChild(contentNode('line'));
			return stack;
		}

		function buildPreview() {
			var loader = document.createElement('div');
			loader.className = 'cni-loader cni-loader--preview';
			loader.setAttribute('role', 'dialog');
			loader.setAttribute('aria-modal', 'true');
			loader.setAttribute('aria-label', __('Loader Preview', 'cni-motion'));
			loader.dataset.cniLoader = value('siteReveal', 'split-horizontal');
			loader.dataset.cniFrequency = 'always';
			loader.dataset.cniLoaderEnter = value('contentEnter', 'fade');
			loader.dataset.cniLoaderExit = value('contentExit', 'fade-out');
			loader.dataset.cniLoaderHold = String(integer('holdDuration', 700));
			loader.dataset.cniLoaderEnterDuration = String(integer('contentEnterDuration', 400));
			loader.dataset.cniLoaderExitDuration = String(integer('contentExitDuration', 400));
			loader.dataset.cniLoaderRevealDuration = String(integer('siteRevealDuration', 500));
			loader.dataset.cniLoaderMaxWait = String(integer('maxWait', 3000));
			loader.dataset.cniContentLayout = value('contentLayout', 'single');
			loader.style.setProperty('--cni-loader-bg', value('backgroundColor', '#ffffff'));
			loader.style.setProperty('--cni-logo-desktop', integer('logoDesktopWidth', 300) + 'px');
			loader.style.setProperty('--cni-logo-mobile', integer('logoMobileWidth', 180) + 'px');
			loader.style.setProperty('--cni-title-desktop', integer('siteTitleDesktopFontSize', 48) + 'px');
			loader.style.setProperty('--cni-title-mobile', integer('siteTitleMobileFontSize', 32) + 'px');
			loader.style.setProperty('--cni-title-weight', String(integer('siteTitleFontWeight', 700)));
			loader.style.setProperty('--cni-title-spacing', decimal('siteTitleLetterSpacing', 0.08) + 'em');
			loader.style.setProperty('--cni-title-color', value('siteTitleTextColor', '#000000'));
			loader.style.color = value('siteTitleTextColor', '#000000');

			['a','b'].forEach(function (suffix) {
				var panel = document.createElement('div');
				panel.className = 'cni-loader__panel cni-loader__panel--' + suffix;
				loader.appendChild(panel);
			});
			var content = document.createElement('div');
			content.className = 'cni-loader__content';
			var inner = contentLayoutNode(value('contentLayout', 'single'));
			if (inner) content.appendChild(inner);
			loader.appendChild(content);
			var close = document.createElement('button');
			close.type = 'button';
			close.className = 'cni-loader-preview-close';
			close.setAttribute('aria-label', __('プレビューを閉じる', 'cni-motion'));
			close.textContent = '×';
			loader.appendChild(close);
			return loader;
		}

		function closePreview() {
			if (previewController) previewController.finish('preview-close');
		}

		var resetButton = document.getElementById('cni-loader-reset');
		if (resetButton) resetButton.addEventListener('click', function () {
			try {
				sessionStorage.removeItem('cni_motion_loader_session_v1');
				localStorage.removeItem('cni_motion_loader_seen_v1');
			} catch (ignore) {}
			window.alert(__('CNI MotionのLoader履歴をリセットしました。', 'cni-motion'));
		});

		var previewButton = document.getElementById('cni-loader-preview');
		if (previewButton) previewButton.addEventListener('click', function () {
			if (!window.CNIMotionLoaderRuntime) {
				window.alert(__('Loader Previewを開始できませんでした。', 'cni-motion'));
				return;
			}
			closePreview();
			var loader = buildPreview();
			document.body.appendChild(loader);
			window.CNIMotionLoaderRuntime.lockScroll(document.documentElement);
			document.body.classList.add('cni-loader-preview-lock');
			previewRootHadReducedClass = document.documentElement.classList.contains('cni-motion-reduced-enabled');
			var reduced = !!config.reducedMotion && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
			if (reduced) document.documentElement.classList.add('cni-motion-reduced-enabled');
			previewController = window.CNIMotionLoaderRuntime.run(loader, {
				reduced: reduced,
				ignoreFrequency: true,
				manageRoot: false,
				emitEvents: false,
				readyPromise: Promise.resolve(),
				onComplete: function () {
					document.body.classList.remove('cni-loader-preview-lock');
					window.CNIMotionLoaderRuntime.unlockScroll(document.documentElement);
					if (!previewRootHadReducedClass) document.documentElement.classList.remove('cni-motion-reduced-enabled');
					previewController = null;
				}
			});
			loader.querySelector('.cni-loader-preview-close').addEventListener('click', closePreview);
		});

		document.addEventListener('keydown', function (event) {
			if (event.key === 'Escape') closePreview();
		});

		var preset = input('preset');
		if (preset) preset.addEventListener('change', function () {
			var values = config.presets && config.presets[this.value];
			if (!values) return;
			Object.keys(values).forEach(function (key) { setField(key, values[key]); });
		});

		var imageButton = document.getElementById('cni-select-image');
		if (imageButton) imageButton.addEventListener('click', function () {
			if (!wp || typeof wp.media !== 'function') {
				window.alert(__('メディアライブラリを開けませんでした。', 'cni-motion'));
				return;
			}
			var frame = wp.media({title:__('Loader画像を選択', 'cni-motion'), multiple:false, library:{type:'image'}});
			frame.on('select', function () {
				var item = frame.state().get('selection').first().toJSON();
				var imageId = document.getElementById('cni-custom-image-id');
				var imagePreview = document.getElementById('cni-image-preview');
				config.customImageUrl = item.url;
				if (imageId) {
					imageId.value = String(item.id);
					emit(imageId, 'input');
					emit(imageId, 'change');
				}
				if (imagePreview) {
					imagePreview.src = item.url;
					imagePreview.style.display = '';
				}
			});
			frame.open();
		});
	});
}(window.wp));
