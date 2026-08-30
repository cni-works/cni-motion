(function (wp) {
	'use strict';
	var el = wp.element.createElement, Fragment = wp.element.Fragment, useEffect = wp.element.useEffect, useState = wp.element.useState;
	var __ = wp.i18n.__, _x = wp.i18n._x, sprintf = wp.i18n.sprintf;
	var InspectorControls = wp.blockEditor.InspectorControls;
	var PanelBody = wp.components.PanelBody, SelectControl = wp.components.SelectControl, ToggleControl = wp.components.ToggleControl, RangeControl = wp.components.RangeControl, TextControl = wp.components.TextControl, TextareaControl = wp.components.TextareaControl, Button = wp.components.Button;
	var api = window.CNIMotionRegistryAPI;
	var textApi = window.CNIMotionTextAPI;
	var textData = window.CNIMotionTextData || {}, textBlocks = Array.isArray(textData.blocks) ? textData.blocks : [], textEffects = textApi && Array.isArray(textApi.effects) ? textApi.effects : [];
	var editorConfig = window.CNIMotionEditorConfig || {};
	var attributeSchema = editorConfig.attributes || {};
	var parallaxData = editorConfig.parallax || {}, parallaxBlocks = parallaxData.blocks && typeof parallaxData.blocks === 'object' ? parallaxData.blocks : {};
	var blockToolsData = editorConfig.blockTools || {}, moduleSettings = editorConfig.modules || {};
	var customCssBlocks = blockToolsData.customCss && typeof blockToolsData.customCss === 'object' ? blockToolsData.customCss : {};
	var visibilityBlocks = blockToolsData.visibility && typeof blockToolsData.visibility === 'object' ? blockToolsData.visibility : {};
	var categories = [{slug:'entrance',label:_x('— Entrance —','effect category','cni-motion')},{slug:'reveal',label:_x('— Reveal —','effect category','cni-motion')},{slug:'emphasis',label:_x('— Emphasis —','effect category','cni-motion')}];
	var frequentSlugs = ['fade','fade-up','zoom-in','blur-zoom-out','clip-reveal-left'];
	var triggerLabels = {auto:__('自動','cni-motion'),'site-ready':__('Site Ready','cni-motion'),scroll:__('スクロール','cni-motion'),hover:__('ホバー / フォーカス','cni-motion'),immediate:__('即時','cni-motion')};
	var speedValues = {fast:400,normal:600,slow:800,'very-slow':1200};
	var delayValues = [0,100,200,300,400,500,600,800,1000];
	var distanceValues = [8,16,24,40];
	var staggerValues = [50,100,150,200,300,400];
	var characterIntervals = [30,50,70,100,150];
	var emptyCustomCssTemplate = 'selector {\n\n\n}';
	var responsiveCssTemplates = {
		selector:'selector {\n\n}',
		mobile:'@media screen and (max-width: 480px) {\n    /* 480px以下：スマホ用 */\n    selector {\n\n    }\n}',
		tablet:'@media screen and (min-width: 481px) and (max-width: 959px) {\n    /* 481〜959px：タブレット用 */\n    selector {\n\n    }\n}',
		desktop:'@media screen and (min-width: 960px) {\n    /* 960px以上：PC用 */\n    selector {\n\n    }\n}'
	};

	function addAttributes(settings, name) {
		if ((!api || !api.matrix[name]) && !parallaxBlocks[name] && !customCssBlocks[name] && !visibilityBlocks[name]) return settings;
		settings.attributes = Object.assign({}, settings.attributes || {});
		Object.keys(attributeSchema).forEach(function (key) { settings.attributes[key] = settings.attributes[key] || attributeSchema[key]; });
		return settings;
	}
	wp.hooks.addFilter('blocks.registerBlockType','cni-motion/attributes',addAttributes);

	function effectOptions(name) {
		var available = api.forBlock(name), options = [{label:__('なし','cni-motion'),value:''}];
		var frequent = frequentSlugs.map(function (slug) { return api.get(slug); }).filter(function (effect) { return effect && available.indexOf(effect) !== -1; });
		if (frequent.length) {
			options.push({label:_x('— よく使う —','effect category','cni-motion'),value:'__frequent',disabled:true});
			frequent.forEach(function (effect) { options.push({label:effect.label,value:effect.slug}); });
		}
		categories.forEach(function (category) {
			var items = available.filter(function (effect) { return effect.category === category.slug; });
			if (!items.length) return;
			options.push({label:category.label,value:'__' + category.slug,disabled:true});
			items.forEach(function (effect) { options.push({label:effect.label,value:effect.slug}); });
		});
		return options;
	}
	function optionValue(mode, value, presets, prefix) {
		if (mode === 'custom' || presets.indexOf(value) === -1) return 'custom';
		return prefix + value;
	}
	function delayOptions() {
		var labels = {0:__('なし','cni-motion'),100:__('0.1秒','cni-motion'),200:__('0.2秒','cni-motion'),300:__('0.3秒','cni-motion'),400:__('0.4秒','cni-motion'),500:__('0.5秒','cni-motion'),600:__('0.6秒','cni-motion'),800:__('0.8秒','cni-motion'),1000:__('1.0秒','cni-motion')};
		return delayValues.map(function (value) { return {label:labels[value],value:'preset-' + value}; }).concat({label:__('カスタム','cni-motion'),value:'custom'});
	}
	function distanceOptions(definition) {
		return [{label:sprintf(__('推奨 (%dpx)','cni-motion'),definition.defaultDistance),value:'effect-default'},{label:__('極小 (8px)','cni-motion'),value:'preset-8'},{label:__('小 (16px)','cni-motion'),value:'preset-16'},{label:__('標準 (24px)','cni-motion'),value:'preset-24'},{label:__('大 (40px)','cni-motion'),value:'preset-40'},{label:__('カスタム','cni-motion'),value:'custom'}];
	}
	function staggerOptions() {
		return [{label:__('0.05秒','cni-motion'),value:'preset-50'},{label:__('0.1秒','cni-motion'),value:'preset-100'},{label:__('0.15秒','cni-motion'),value:'preset-150'},{label:__('0.2秒','cni-motion'),value:'preset-200'},{label:__('0.3秒','cni-motion'),value:'preset-300'},{label:__('0.4秒','cni-motion'),value:'preset-400'},{label:__('カスタム','cni-motion'),value:'custom'}];
	}
	function intensityOptions(definition) {
		if (definition.supports.intensity === 'zoom') return [{label:__('控えめ (0.86)','cni-motion'),value:'standard'},{label:__('強め (0.65)','cni-motion'),value:'strong'},{label:__('ダイナミック (0.30・Otter風)','cni-motion'),value:'dynamic'}];
		return [{label:__('標準 (1.12)','cni-motion'),value:'standard'},{label:__('Strong (1.20)','cni-motion'),value:'strong'}];
	}
	function resolvedIntensity(value, definition) {
		var allowed = intensityOptions(definition).map(function (option) { return option.value; });
		return allowed.indexOf(value) !== -1 ? value : 'standard';
	}
	function resolvedDuration(attributes, definition) { return attributes.cniMotionSpeedMode === 'recommended' ? definition.defaultDuration : attributes.cniMotionDuration; }
	function resolvedEasing(attributes, definition) { return attributes.cniMotionEasing === 'recommended' ? definition.defaultEasing : attributes.cniMotionEasing; }
	function resolvedDistance(attributes, definition) { return attributes.cniMotionDistanceMode === 'effect-default' && definition.defaultDistance !== null ? definition.defaultDistance : attributes.cniMotionDistance; }
	function findBlockNode(clientId) {
		if (typeof wp.blockEditor.getBlockDOMNode === 'function') { try { var apiNode = wp.blockEditor.getBlockDOMNode(clientId); if (apiNode) return apiNode; } catch (ignore) {} }
		function findIn(doc) { return doc && (doc.getElementById('block-' + clientId) || doc.querySelector('[data-block="' + clientId + '"]')); }
		var node = findIn(document);
		if (node) return node;
		var frames = document.querySelectorAll('iframe');
		for (var index = 0; index < frames.length; index++) { try { node = findIn(frames[index].contentDocument); if (node) return node; } catch (ignoreFrame) {} }
		return null;
	}
	function findTextTarget(node) {
		if (!node) return null;
		if (/^(H[1-6]|P)$/i.test(node.tagName || '')) return node;
		return node.querySelector('h1,h2,h3,h4,h5,h6,p,[contenteditable="true"]');
	}
	function clearTextReplay(node) {
		if (node && node.cniTextEditorCleanup) { node.cniTextEditorCleanup(); node.cniTextEditorCleanup = null; }
		if (node && node.cniTextEditorTimer) { (node.ownerDocument.defaultView || window).clearTimeout(node.cniTextEditorTimer); node.cniTextEditorTimer = null; }
	}
	function replayCharacter(props) {
		if (!textApi) return;
		var blockNode = findBlockNode(props.clientId), target = findTextTarget(blockNode), a = props.attributes;
		if (!target) return; clearTextReplay(target);
		var instance = textApi.character(target,{effect:a.cniMotionTextEffect,duration:a.cniMotionTextDuration,interval:a.cniMotionTextInterval,delay:a.cniMotionDelay});
		if (!instance) return; target.cniTextEditorCleanup = instance.cleanup;
		var total = Math.min(10000, a.cniMotionDelay + a.cniMotionTextDuration + 4200);
		target.cniTextEditorTimer = (target.ownerDocument.defaultView || window).setTimeout(function(){clearTextReplay(target);},total);
	}
	function previewMarquee(props) {
		if (!textApi) return;
		var blockNode = findBlockNode(props.clientId), target = findTextTarget(blockNode), a = props.attributes;
		if (!target) return; clearTextReplay(target);
		var instance = textApi.marquee(target,{direction:a.cniMotionMarqueeDirection,speed:a.cniMotionMarqueeSpeed,gap:a.cniMotionMarqueeGap,fade:a.cniMotionMarqueeFade,pauseHover:a.cniMotionMarqueePauseHover,mobile:true});
		if (!instance) return; target.cniTextEditorCleanup = instance.cleanup;
		target.cniTextEditorTimer = (target.ownerDocument.defaultView || window).setTimeout(function(){clearTextReplay(target);},6000);
	}

	function replay(props, definition) {
		var a = props.attributes;
		if (!definition || !api.supportsEffect(props.name, a.cniMotionEffect)) return;
		var node = findBlockNode(props.clientId);
		if (!node) return;
		var nodeDocument = node.ownerDocument || document, nodeWindow = nodeDocument.defaultView || window;
		var duration = resolvedDuration(a, definition);
		if (node.cniMotionEditorCleanup) node.cniMotionEditorCleanup();
		var classNames = ['cni-motion','cni-motion--pending','cni-motion--running','cni-motion--complete','cni-motion--measuring'];
		var attributes = ['data-cni-motion','data-cni-category','data-cni-intensity'];
		var properties = ['--cni-motion-duration','--cni-motion-delay','--cni-motion-distance','--cni-motion-easing','--cni-motion-mask-color','--cni-motion-target-transform','--cni-motion-target-filter','--cni-motion-target-clip'];
		var originalClasses = {}, originalAttributes = {}, originalProperties = {};
		classNames.forEach(function (name) { originalClasses[name] = node.classList.contains(name); });
		attributes.forEach(function (name) { originalAttributes[name] = node.getAttribute(name); });
		properties.forEach(function (name) { originalProperties[name] = {value:node.style.getPropertyValue(name),priority:node.style.getPropertyPriority(name)}; });
		var token = {};
		node.cniMotionEditorToken = token;
		function cleanup() {
			if (node.cniMotionEditorToken !== token) return;
			nodeWindow.clearTimeout(node.cniMotionEditorTimer);
			node.removeEventListener('transitionend', finish);
			node.removeEventListener('animationend', finish);
			classNames.forEach(function (name) { node.classList.toggle(name, originalClasses[name]); });
			attributes.forEach(function (name) { if (originalAttributes[name] === null) node.removeAttribute(name); else node.setAttribute(name, originalAttributes[name]); });
			properties.forEach(function (name) { var original = originalProperties[name]; if (original.value) node.style.setProperty(name, original.value, original.priority); else node.style.removeProperty(name); });
			node.cniMotionEditorCleanup = null;
			node.cniMotionEditorToken = null;
		}
		function finish(endEvent) { if (!endEvent || endEvent.target === node) cleanup(); }
		node.cniMotionEditorCleanup = cleanup;
		nodeDocument.documentElement.classList.add('cni-motion-js');
		var current = nodeWindow.getComputedStyle(node);
		node.setAttribute('data-cni-motion', definition.slug);
		node.setAttribute('data-cni-category', definition.category);
		node.setAttribute('data-cni-intensity', resolvedIntensity(a.cniMotionIntensity, definition));
		node.style.setProperty('--cni-motion-duration', duration + 'ms');
		node.style.setProperty('--cni-motion-delay', a.cniMotionDelay + 'ms');
		node.style.setProperty('--cni-motion-distance', resolvedDistance(a, definition) + 'px');
		node.style.setProperty('--cni-motion-easing', resolvedEasing(a, definition));
		node.style.setProperty('--cni-motion-mask-color', a.cniMotionMaskColor || '#ffffff');
		node.style.setProperty('--cni-motion-target-transform', current.transform || 'none');
		node.style.setProperty('--cni-motion-target-filter', current.filter || 'none');
		node.style.setProperty('--cni-motion-target-clip', current.clipPath || 'none');
		node.classList.remove('cni-motion--complete','cni-motion--running');
		node.classList.add('cni-motion','cni-motion--pending','cni-motion--measuring');
		void node.offsetWidth;
		node.classList.remove('cni-motion--measuring');
		node.addEventListener('transitionend', finish);
		node.addEventListener('animationend', finish);
		nodeWindow.requestAnimationFrame(function () { nodeWindow.requestAnimationFrame(function () { if (node.cniMotionEditorToken === token) { node.classList.remove('cni-motion--pending'); node.classList.add('cni-motion--running'); } }); });
		node.cniMotionEditorTimer = nodeWindow.setTimeout(cleanup, duration + a.cniMotionDelay + 160);
	}

	function parallaxPanel(props) {
		if (!parallaxBlocks[props.name]) return null;
		var a = props.attributes, set = props.setAttributes, enabled = !!a.cniParallaxEnabled;
		var controls = [el(ToggleControl,{label:__('パララックス','cni-motion'),checked:enabled,onChange:function(v){set({cniParallaxEnabled:v});},key:'parallax-enabled'})];
		if (enabled) {
			controls.push(el(SelectControl,{label:__('強さ','cni-motion'),value:a.cniParallaxStrength || 'standard',options:[{label:__('控えめ','cni-motion'),value:'subtle'},{label:__('標準','cni-motion'),value:'standard'},{label:__('強め','cni-motion'),value:'strong'}],onChange:function(v){set({cniParallaxStrength:v});},key:'parallax-strength'}));
			controls.push(el(SelectControl,{label:__('方向','cni-motion'),value:a.cniParallaxDirection || 'normal',options:[{label:__('通常','cni-motion'),value:'normal'},{label:__('逆方向','cni-motion'),value:'reverse'}],onChange:function(v){set({cniParallaxDirection:v});},key:'parallax-direction'}));
			controls.push(el(ToggleControl,{label:__('モバイルでも有効','cni-motion'),help:a.cniParallaxMobile ? __('スマートフォンでも画像を動かします。','cni-motion') : __('スマートフォンでは静止表示にします。','cni-motion'),checked:!!a.cniParallaxMobile,onChange:function(v){set({cniParallaxMobile:v});},key:'parallax-mobile'}));
			controls.push(el('p',{className:'components-base-control__help',key:'parallax-help'},__('公開画面では画像レイヤーだけがスクロールに合わせて動きます。','cni-motion')));
		}
		return el(PanelBody,{title:__('CNI Parallax','cni-motion'),initialOpen:false,key:'cni-parallax-panel'},controls);
	}

	function createCssId() {
		var bytes = new Uint8Array(6), value = '';
		if (window.crypto && typeof window.crypto.getRandomValues === 'function') window.crypto.getRandomValues(bytes);
		else for (var index = 0; index < bytes.length; index++) bytes[index] = Math.floor(Math.random() * 256);
		for (var offset = 0; offset < bytes.length; offset++) value += bytes[offset].toString(16).padStart(2,'0');
		return 'cni-block-' + value;
	}

	function cssIdUsedByOther(props, id) {
		if (!id || !wp.data || !wp.data.select) return false;
		var store = wp.data.select('core/block-editor');
		if (!store || typeof store.getBlocks !== 'function') return false;
		var found = false;
		function inspect(blocks) {
			(blocks || []).forEach(function(block){
				if (found) return;
				if (block.clientId !== props.clientId && block.attributes && block.attributes.cniCssId === id) found = true;
				if (!found && block.innerBlocks && block.innerBlocks.length) inspect(block.innerBlocks);
			});
		}
		inspect(store.getBlocks());
		return found;
	}

	function customCssWarning(value) {
		if (!value.trim()) return '';
		if (/<|@\s*(?:import|font-face|namespace|keyframes)\b|expression\s*\(|javascript\s*:/i.test(value)) return __('使用できないCSS記法が含まれています。Frontendへは出力されません。','cni-motion');
		if (!/\bselector\b/i.test(value)) return __('各CSSルールはselectorから始めてください。','cni-motion');
		return '';
	}

	function isEmptyCustomCss(value) {
		var withoutComments = String(value || '').replace(/\/\*[\s\S]*?\*\//g, '');
		return !withoutComments.trim() || /^\s*selector\s*\{\s*\}\s*$/i.test(withoutComments);
	}

	function copyText(value) {
		if (window.navigator && window.navigator.clipboard && typeof window.navigator.clipboard.writeText === 'function') return window.navigator.clipboard.writeText(value);
		return new Promise(function (resolve, reject) {
			var field = document.createElement('textarea');
			field.value = value;
			field.setAttribute('readonly','readonly');
			field.style.position = 'fixed'; field.style.opacity = '0';
			document.body.appendChild(field); field.select();
			try { if (!document.execCommand('copy')) throw new Error('copy failed'); resolve(); }
			catch (error) { reject(error); }
			finally { document.body.removeChild(field); }
		});
	}

	function ResponsiveCssTemplates() {
		var feedbackState = useState(''), feedback = feedbackState[0], setFeedback = feedbackState[1];
		function copy(kind) {
			copyText(responsiveCssTemplates[kind]).then(function () { setFeedback(__('コピーしました','cni-motion')); }, function () { setFeedback(__('コピーできませんでした','cni-motion')); });
		}
		return el('div',{className:'cni-responsive-css-templates'},
			el('p',{className:'cni-responsive-css-templates__title'},__('CSS テンプレート','cni-motion')),
			el('div',{className:'cni-responsive-css-templates__buttons'},
				el(Button,{variant:'secondary',isSmall:true,onClick:function(){copy('selector');}},__('selectorをコピー','cni-motion')),
				el(Button,{variant:'secondary',isSmall:true,onClick:function(){copy('mobile');}},__('スマホ用をコピー','cni-motion')),
				el(Button,{variant:'secondary',isSmall:true,onClick:function(){copy('tablet');}},__('タブレット用をコピー','cni-motion')),
				el(Button,{variant:'secondary',isSmall:true,onClick:function(){copy('desktop');}},__('PC用をコピー','cni-motion'))
			),
			el('p',{className:'components-base-control__help'},__('コピー後、Custom CSS欄の必要な位置へ貼り付けて編集してください。通常CSSの追加にはselectorを使用します。','cni-motion')),
			feedback && el('p',{className:'components-base-control__help cni-responsive-css-templates__feedback','aria-live':'polite'},feedback)
		);
	}

	function CustomCssPreview(props) {
		var css = props.attributes.cniCustomCss || '', cssId = props.attributes.cniCssId || '';
		useEffect(function () {
			if (!props.isSelected || !moduleSettings.customCss || !customCssBlocks[props.name] || !editorConfig.canUseCustomCss) return;
			if (!/^cni-block-[a-z0-9]{8,32}$/.test(cssId) || !window.CNIMotionCustomCssPreviewAPI) return;
			var compiled = window.CNIMotionCustomCssPreviewAPI.compile(css, '.' + cssId);
			if (!compiled) return;
			var node = findBlockNode(props.clientId);
			if (!node || !node.ownerDocument || !node.ownerDocument.head) return;
			var doc = node.ownerDocument, style = doc.createElement('style'), hadClass = node.classList.contains(cssId);
			style.setAttribute('data-cni-custom-css-preview', props.clientId);
			style.textContent = compiled;
			node.classList.add(cssId);
			doc.head.appendChild(style);
			return function () {
				if (style.parentNode) style.parentNode.removeChild(style);
				if (!hadClass) node.classList.remove(cssId);
			};
		}, [props.isSelected, props.name, props.clientId, css, cssId]);
		return null;
	}

	function blockToolsPanel(props) {
		var visibilityEnabled = !!moduleSettings.visibility && !!visibilityBlocks[props.name];
		var customCssEnabled = !!moduleSettings.customCss && !!customCssBlocks[props.name];
		if (!visibilityEnabled && !customCssEnabled) return null;
		var a = props.attributes, set = props.setAttributes;
		var controls = [];
		if (visibilityEnabled) {
			controls.push(el(SelectControl,{label:__('表示条件','cni-motion'),value:a.cniVisibility || 'all',options:[{label:__('常に表示','cni-motion'),value:'all'},{label:__('ログインユーザーのみ','cni-motion'),value:'logged-in'},{label:__('非ログインユーザーのみ','cni-motion'),value:'logged-out'}],onChange:function(v){set({cniVisibility:v});},key:'cni-visibility'}));
			controls.push(el('p',{className:'components-base-control__help',key:'cni-visibility-help'},__('編集画面では条件にかかわらずブロックを表示します。この機能は機密情報のアクセス制御ではありません。','cni-motion')));
		}
		if (customCssEnabled) {
			if (editorConfig.canUseCustomCss) {
				controls.push(el(TextareaControl,{label:__('Custom CSS','cni-motion'),value:a.cniCustomCss || emptyCustomCssTemplate,rows:10,onChange:function(value){var empty=isEmptyCustomCss(value),updates={cniCustomCss:empty?'':value};if(empty)updates.cniCssId='';else if(!/^cni-block-[a-z0-9]{8,32}$/.test(a.cniCssId||'')||cssIdUsedByOther(props,a.cniCssId))updates.cniCssId=createCssId();set(updates);},help:__('selectorから始まるルールと@mediaを使用できます。入力内容は選択中のブロックへリアルタイム反映されます。','cni-motion'),key:'cni-custom-css'}));
				var warning = customCssWarning(a.cniCustomCss || '');
				if (warning) controls.push(el('p',{className:'components-base-control__help cni-custom-css-warning',key:'cni-custom-css-warning'},warning));
				controls.push(el(ResponsiveCssTemplates,{key:'cni-responsive-css-templates'}));
			} else controls.push(el('p',{className:'components-base-control__help',key:'cni-custom-css-permission'},__('Custom CSSの編集にはunfiltered_html権限が必要です。','cni-motion')));
		}
		return el(PanelBody,{title:__('CNI Block Settings','cni-motion'),initialOpen:false,key:'cni-block-tools-panel'},controls);
	}

	function withInspector(BlockEdit) {
		return function (props) {
			var motionSupported = !!api && !!api.matrix[props.name];
			var blockToolsUiSupported = (!!moduleSettings.customCss && !!customCssBlocks[props.name]) || (!!moduleSettings.visibility && !!visibilityBlocks[props.name]);
			if (!motionSupported && !parallaxBlocks[props.name] && !blockToolsUiSupported) return el(BlockEdit, props);
			var customCssPreview = el(CustomCssPreview,{name:props.name,clientId:props.clientId,isSelected:props.isSelected,attributes:props.attributes,key:'cni-custom-css-preview'});
			if (!motionSupported) return el(Fragment,null,el(InspectorControls,null,blockToolsPanel(props),parallaxPanel(props)),el(BlockEdit,props),customCssPreview);
			var a = props.attributes, set = props.setAttributes, enabled = !!a.cniMotionEnabled, mode = a.cniMotionMode || 'block', textSupported = textBlocks.indexOf(props.name) !== -1;
			var definition = api.get(a.cniMotionEffect) || api.get('fade');
			var canReplay = !!definition && api.supportsEffect(props.name, a.cniMotionEffect);
			var basicControls = [el(ToggleControl,{label:__('アニメーション','cni-motion'),checked:enabled,onChange:function(v){set({cniMotionEnabled:v});},key:'enabled'})];
			var detailControls = [];
			if (enabled) {
				var modeOptions = [{label:__('ブロックアニメーション','cni-motion'),value:'block'}];
				if (textSupported) modeOptions.push({label:__('文字アニメーション','cni-motion'),value:'character'},{label:__('テキストマーキー','cni-motion'),value:'marquee'});
				basicControls.push(el(SelectControl,{label:__('モーション形式','cni-motion'),value:mode,options:modeOptions,onChange:function(v){var updates={cniMotionMode:v};if(v!=='block'&&a.cniMotionTrigger==='hover')updates.cniMotionTrigger='auto';set(updates);},key:'mode'}));
				if (mode === 'character' && textSupported) {
					basicControls.push(el(SelectControl,{label:__('文字エフェクト','cni-motion'),value:a.cniMotionTextEffect,options:textEffects.map(function(effect){return {label:effect.label,value:effect.slug};}),onChange:function(v){var selected=textEffects.find(function(effect){return effect.slug===v;});set({cniMotionTextEffect:v,cniMotionTextDuration:selected?selected.defaultDuration:a.cniMotionTextDuration});},key:'text-effect'}));
					basicControls.push(el(SelectControl,{label:__('発火','cni-motion'),value:a.cniMotionTrigger,options:['auto','site-ready','scroll','immediate'].map(function(trigger){return {label:triggerLabels[trigger],value:trigger};}),onChange:function(v){set({cniMotionTrigger:v});},key:'text-trigger'}));
					var intervalValue = a.cniMotionTextIntervalMode === 'custom' || characterIntervals.indexOf(a.cniMotionTextInterval) === -1 ? 'custom' : 'preset-' + a.cniMotionTextInterval;
					basicControls.push(el(SelectControl,{label:__('文字間隔','cni-motion'),value:intervalValue,options:[{label:__('かなり速い (0.03秒)','cni-motion'),value:'preset-30'},{label:__('速い (0.05秒)','cni-motion'),value:'preset-50'},{label:__('標準 (0.07秒)','cni-motion'),value:'preset-70'},{label:__('ゆっくり (0.10秒)','cni-motion'),value:'preset-100'},{label:__('かなり遅い (0.15秒)','cni-motion'),value:'preset-150'},{label:__('カスタム','cni-motion'),value:'custom'}],onChange:function(v){if(v==='custom')set({cniMotionTextIntervalMode:'custom'});else set({cniMotionTextIntervalMode:'preset',cniMotionTextInterval:parseInt(v.replace('preset-',''),10)});},key:'text-interval'}));
					if(intervalValue==='custom')basicControls.push(el(RangeControl,{label:__('カスタム文字間隔 (ms)','cni-motion'),value:a.cniMotionTextInterval,min:20,max:500,step:5,onChange:function(v){set({cniMotionTextIntervalMode:'custom',cniMotionTextInterval:v});},key:'text-interval-custom'}));
					basicControls.push(el(RangeControl,{label:__('1文字の時間 (ms)','cni-motion'),value:a.cniMotionTextDuration,min:40,max:2000,step:20,onChange:function(v){set({cniMotionTextDuration:v});},key:'text-duration'}));
					var textDelay = optionValue(a.cniMotionDelayMode,a.cniMotionDelay,delayValues,'preset-');
					basicControls.push(el(SelectControl,{label:__('開始遅延','cni-motion'),value:textDelay,options:delayOptions(),onChange:function(v){if(v==='custom')set({cniMotionDelayMode:'custom'});else set({cniMotionDelayMode:'preset',cniMotionDelay:parseInt(v.replace('preset-',''),10)});},key:'text-delay'}));
					if(textDelay==='custom')basicControls.push(el(RangeControl,{label:__('カスタム遅延 (ms)','cni-motion'),value:a.cniMotionDelay,min:0,max:10000,step:50,onChange:function(v){set({cniMotionDelayMode:'custom',cniMotionDelay:v});},key:'text-delay-custom'}));
					detailControls.push(el(SelectControl,{label:__('表示タイミング','cni-motion'),value:a.cniMotionTriggerOffsetMode,options:[{label:__('早め','cni-motion'),value:'early'},{label:__('標準','cni-motion'),value:'normal'},{label:__('遅め','cni-motion'),value:'late'},{label:__('カスタム','cni-motion'),value:'custom'}],onChange:function(v){set({cniMotionTriggerOffsetMode:v,cniMotionTriggerOffset:v==='early'?0:v==='late'?25:v==='normal'?12:a.cniMotionTriggerOffset});},key:'text-offset'}));
					if(a.cniMotionTriggerOffsetMode==='custom')detailControls.push(el(RangeControl,{label:__('画面内への入り具合 (%)','cni-motion'),value:a.cniMotionTriggerOffset,min:0,max:50,onChange:function(v){set({cniMotionTriggerOffset:v});},key:'text-offset-custom'}));
					detailControls.push(el(ToggleControl,{label:__('モバイルでMotion','cni-motion'),checked:a.cniMotionMobile,onChange:function(v){set({cniMotionMobile:v});},key:'text-mobile'}));
					basicControls.push(el(Button,{variant:'secondary',className:'cni-motion-replay',onClick:function(){replayCharacter(props);},key:'text-replay'},__('アニメーションを再生','cni-motion')));
					return el(Fragment,null,el(InspectorControls,null,el(PanelBody,{title:__('CNI Motion','cni-motion'),initialOpen:false},basicControls),blockToolsPanel(props),el(PanelBody,{title:__('詳細設定','cni-motion'),initialOpen:false},detailControls),parallaxPanel(props)),el(BlockEdit,props),customCssPreview);
				}
				if (mode === 'marquee' && textSupported) {
					basicControls.push(el(SelectControl,{label:__('方向','cni-motion'),value:a.cniMotionMarqueeDirection,options:[{label:__('左へ','cni-motion'),value:'left'},{label:__('右へ','cni-motion'),value:'right'}],onChange:function(v){set({cniMotionMarqueeDirection:v});},key:'marquee-direction'}));
					basicControls.push(el(SelectControl,{label:__('速度','cni-motion'),value:a.cniMotionMarqueeSpeedMode,options:[{label:__('遅い (30px/秒)','cni-motion'),value:'slow'},{label:__('標準 (50px/秒)','cni-motion'),value:'normal'},{label:__('速い (70px/秒)','cni-motion'),value:'fast'},{label:__('カスタム','cni-motion'),value:'custom'}],onChange:function(v){set({cniMotionMarqueeSpeedMode:v,cniMotionMarqueeSpeed:v==='slow'?30:v==='fast'?70:v==='normal'?50:a.cniMotionMarqueeSpeed});},key:'marquee-speed'}));
					if(a.cniMotionMarqueeSpeedMode==='custom')basicControls.push(el(RangeControl,{label:__('カスタム速度 (px/秒)','cni-motion'),value:a.cniMotionMarqueeSpeed,min:10,max:200,step:5,onChange:function(v){set({cniMotionMarqueeSpeed:v});},key:'marquee-speed-custom'}));
					basicControls.push(el(SelectControl,{label:__('文字列間隔','cni-motion'),value:a.cniMotionMarqueeGapMode,options:[{label:__('小 (24px)','cni-motion'),value:'small'},{label:__('標準 (48px)','cni-motion'),value:'normal'},{label:__('大 (80px)','cni-motion'),value:'large'},{label:__('カスタム','cni-motion'),value:'custom'}],onChange:function(v){set({cniMotionMarqueeGapMode:v,cniMotionMarqueeGap:v==='small'?24:v==='large'?80:v==='normal'?48:a.cniMotionMarqueeGap});},key:'marquee-gap'}));
					if(a.cniMotionMarqueeGapMode==='custom')basicControls.push(el(RangeControl,{label:__('カスタム間隔 (px)','cni-motion'),value:a.cniMotionMarqueeGap,min:0,max:300,onChange:function(v){set({cniMotionMarqueeGap:v});},key:'marquee-gap-custom'}));
					detailControls.push(el(ToggleControl,{label:__('端をフェード','cni-motion'),checked:a.cniMotionMarqueeFade,onChange:function(v){set({cniMotionMarqueeFade:v});},key:'marquee-fade'}));
					detailControls.push(el(ToggleControl,{label:__('ホバーで停止','cni-motion'),checked:a.cniMotionMarqueePauseHover,onChange:function(v){set({cniMotionMarqueePauseHover:v});},key:'marquee-hover'}));
					detailControls.push(el(ToggleControl,{label:__('モバイルで表示','cni-motion'),checked:a.cniMotionMarqueeMobile,onChange:function(v){set({cniMotionMarqueeMobile:v});},key:'marquee-mobile'}));
					basicControls.push(el(Button,{variant:'secondary',className:'cni-motion-replay',onClick:function(){previewMarquee(props);},key:'marquee-replay'},__('ループをプレビュー','cni-motion')));
					return el(Fragment,null,el(InspectorControls,null,el(PanelBody,{title:__('CNI Motion','cni-motion'),initialOpen:false},basicControls),blockToolsPanel(props),el(PanelBody,{title:__('詳細設定','cni-motion'),initialOpen:false},detailControls),parallaxPanel(props)),el(BlockEdit,props),customCssPreview);
				}
				basicControls.push(el(SelectControl,{label:__('エフェクト','cni-motion'),value:a.cniMotionEffect,options:effectOptions(props.name),onChange:function(v){
					if (v === '') { set({cniMotionEnabled:false,cniMotionEffect:'fade'}); return; }
					if (v.indexOf('__') === 0) return;
					var next = api.get(v), updates = {cniMotionEffect:v};
					if (a.cniMotionSpeedMode === 'recommended') updates.cniMotionDuration = next.defaultDuration;
					if (a.cniMotionDistanceMode === 'effect-default' && next.defaultDistance !== null) updates.cniMotionDistance = next.defaultDistance;
					if (next.triggers.indexOf(a.cniMotionTrigger) === -1) updates.cniMotionTrigger = 'auto';
					if (next.category !== 'entrance') updates.cniMotionOnce = true;
					if (!next.supports.intensity || intensityOptions(next).map(function(option){return option.value;}).indexOf(a.cniMotionIntensity) === -1) updates.cniMotionIntensity = 'standard';
					set(updates);
				},key:'effect'}));
				basicControls.push(el(SelectControl,{label:__('発火','cni-motion'),value:a.cniMotionTrigger,options:definition.triggers.map(function(trigger){return {label:triggerLabels[trigger],value:trigger};}),onChange:function(v){set({cniMotionTrigger:v});},key:'trigger'}));
				basicControls.push(el(SelectControl,{label:__('速度','cni-motion'),value:a.cniMotionSpeedMode,options:[{label:__('推奨','cni-motion'),value:'recommended'},{label:__('速い (400ms)','cni-motion'),value:'fast'},{label:__('標準 (600ms)','cni-motion'),value:'normal'},{label:__('ゆっくり (800ms)','cni-motion'),value:'slow'},{label:__('かなりゆっくり (1200ms)','cni-motion'),value:'very-slow'},{label:__('カスタム','cni-motion'),value:'custom'}],onChange:function(v){set({cniMotionSpeedMode:v,cniMotionDuration:v === 'recommended' ? definition.defaultDuration : (speedValues[v] || a.cniMotionDuration)});},key:'speed'}));
				if (a.cniMotionSpeedMode === 'custom') basicControls.push(el(RangeControl,{label:__('時間 (ms)','cni-motion'),value:a.cniMotionDuration,min:100,max:5000,step:50,onChange:function(v){set({cniMotionDuration:v});},key:'duration'}));
				var delaySelection = optionValue(a.cniMotionDelayMode,a.cniMotionDelay,delayValues,'preset-');
				basicControls.push(el(SelectControl,{label:__('遅延','cni-motion'),value:delaySelection,options:delayOptions(),onChange:function(v){if(v === 'custom') set({cniMotionDelayMode:'custom'}); else set({cniMotionDelayMode:'preset',cniMotionDelay:parseInt(v.replace('preset-',''),10)});},key:'delay-mode'}));
				if (delaySelection === 'custom') basicControls.push(el(RangeControl,{label:__('カスタム遅延 (ms)','cni-motion'),value:a.cniMotionDelay,min:0,max:10000,step:50,onChange:function(v){set({cniMotionDelayMode:'custom',cniMotionDelay:v});},key:'delay-custom'}));
				if (definition.category === 'entrance') basicControls.push(el(ToggleControl,{label:__('一度だけ再生','cni-motion'),checked:a.cniMotionOnce,onChange:function(v){set({cniMotionOnce:v});},key:'once'}));
				if (definition.supports.distance) {
					var distanceSelection = a.cniMotionDistanceMode === 'effect-default' ? 'effect-default' : optionValue(a.cniMotionDistanceMode,a.cniMotionDistance,distanceValues,'preset-');
					detailControls.push(el(SelectControl,{label:__('移動距離','cni-motion'),value:distanceSelection,options:distanceOptions(definition),onChange:function(v){if(v === 'effect-default') set({cniMotionDistanceMode:'effect-default',cniMotionDistance:definition.defaultDistance}); else if(v === 'custom') set({cniMotionDistanceMode:'custom'}); else set({cniMotionDistanceMode:'preset',cniMotionDistance:parseInt(v.replace('preset-',''),10)});},key:'distance-mode'}));
					if (distanceSelection === 'custom') detailControls.push(el(RangeControl,{label:__('カスタム距離 (px)','cni-motion'),value:a.cniMotionDistance,min:0,max:200,step:1,onChange:function(v){set({cniMotionDistanceMode:'custom',cniMotionDistance:v});},key:'distance-custom'}));
				}
				if (definition.supports.intensity) detailControls.push(el(SelectControl,{label:definition.supports.intensity === 'zoom' ? __('ズームの強さ','cni-motion') : __('強さ','cni-motion'),value:resolvedIntensity(a.cniMotionIntensity,definition),options:intensityOptions(definition),onChange:function(v){set({cniMotionIntensity:v});},key:'intensity'}));
				if (definition.supports.maskColor) detailControls.push(el(TextControl,{label:__('マスク色','cni-motion'),type:'color',value:a.cniMotionMaskColor,onChange:function(v){set({cniMotionMaskColor:v});},key:'mask'}));
				detailControls.push(el(SelectControl,{label:__('表示タイミング','cni-motion'),value:a.cniMotionTriggerOffsetMode,options:[{label:__('早め','cni-motion'),value:'early'},{label:__('標準','cni-motion'),value:'normal'},{label:__('遅め','cni-motion'),value:'late'},{label:__('カスタム','cni-motion'),value:'custom'}],onChange:function(v){set({cniMotionTriggerOffsetMode:v,cniMotionTriggerOffset:v === 'early' ? 0 : v === 'late' ? 25 : v === 'normal' ? 12 : a.cniMotionTriggerOffset});},key:'offset'}));
				if (a.cniMotionTriggerOffsetMode === 'custom') detailControls.push(el(RangeControl,{label:__('画面内への入り具合 (%)','cni-motion'),value:a.cniMotionTriggerOffset,min:0,max:50,onChange:function(v){set({cniMotionTriggerOffset:v});},key:'offset-custom'}));
				detailControls.push(el(SelectControl,{label:__('イージング','cni-motion'),value:a.cniMotionEasing,options:[{label:__('推奨','cni-motion'),value:'recommended'},{label:__('Ease Out','cni-motion'),value:'ease-out'},{label:__('Ease In Out','cni-motion'),value:'ease-in-out'},{label:__('Ease','cni-motion'),value:'ease'},{label:__('Linear','cni-motion'),value:'linear'}],onChange:function(v){set({cniMotionEasing:v});},key:'easing'}));
				detailControls.push(el(ToggleControl,{label:__('モバイルでMotion','cni-motion'),checked:a.cniMotionMobile,onChange:function(v){set({cniMotionMobile:v});},key:'mobile'}));
				if (api.supportsStagger(props.name)) {
					detailControls.push(el(ToggleControl,{label:__('子要素を順番に表示','cni-motion'),checked:a.cniMotionStagger,onChange:function(v){set({cniMotionStagger:v});},key:'stagger'}));
					if (a.cniMotionStagger) {
						detailControls.push(el(SelectControl,{label:__('子要素のエフェクト','cni-motion'),value:a.cniMotionStaggerEffect,options:api.all.filter(function(effect){return effect.category === 'entrance';}).map(function(effect){return {label:effect.label,value:effect.slug};}),onChange:function(v){set({cniMotionStaggerEffect:v});},key:'stagger-effect'}));
						detailControls.push(el('p',{className:'components-base-control__help',key:'stagger-delay'},__('開始遅延：上の「遅延」設定を使用します。','cni-motion')));
						var staggerSelection = optionValue(a.cniMotionStaggerIntervalMode,a.cniMotionStaggerInterval,staggerValues,'preset-');
						detailControls.push(el(SelectControl,{label:__('間隔','cni-motion'),value:staggerSelection,options:staggerOptions(),onChange:function(v){if(v === 'custom') set({cniMotionStaggerIntervalMode:'custom'}); else set({cniMotionStaggerIntervalMode:'preset',cniMotionStaggerInterval:parseInt(v.replace('preset-',''),10)});},key:'stagger-interval-mode'}));
						if (staggerSelection === 'custom') detailControls.push(el(RangeControl,{label:__('カスタム間隔 (ms)','cni-motion'),value:a.cniMotionStaggerInterval,min:0,max:2000,step:10,onChange:function(v){set({cniMotionStaggerIntervalMode:'custom',cniMotionStaggerInterval:v});},key:'stagger-interval-custom'}));
						detailControls.push(el(ToggleControl,{label:__('スマホでも順番に表示','cni-motion'),help:a.cniMotionMobileDelay ? __('スマホでも設定した間隔で表示します。','cni-motion') : __('スマホでは間隔をなくして同時に表示します。','cni-motion'),checked:a.cniMotionMobileDelay,onChange:function(v){set({cniMotionMobileDelay:v});},key:'mobile-stagger'}));
						detailControls.push(el('p',{className:'components-base-control__help',key:'stagger-order'},__('順序：通常','cni-motion')));
						detailControls.push(el('p',{className:'components-base-control__help',key:'stagger-priority'},__('子ブロックに個別Motionがある場合は、その設定を優先します。','cni-motion')));
					}
				}
				basicControls.push(el(Button,{variant:'secondary',className:'cni-motion-replay',disabled:!canReplay,onClick:function(){replay(props,definition);},key:'replay'},__('アニメーションを再生','cni-motion')));
			}
			return el(Fragment,null,el(InspectorControls,null,el(PanelBody,{title:__('CNI Motion','cni-motion'),initialOpen:false},basicControls),blockToolsPanel(props),enabled && el(PanelBody,{title:__('詳細設定','cni-motion'),initialOpen:false},detailControls),parallaxPanel(props)),el(BlockEdit,props),customCssPreview);
		};
	}
	wp.hooks.addFilter('editor.BlockEdit','cni-motion/inspector',wp.compose.createHigherOrderComponent(withInspector,'withCniMotionInspector'),1);
}(window.wp));
