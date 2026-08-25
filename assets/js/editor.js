(function (wp) {
	'use strict';
	var el = wp.element.createElement, Fragment = wp.element.Fragment;
	var __ = wp.i18n.__, _x = wp.i18n._x, sprintf = wp.i18n.sprintf;
	var InspectorControls = wp.blockEditor.InspectorControls;
	var PanelBody = wp.components.PanelBody, SelectControl = wp.components.SelectControl, ToggleControl = wp.components.ToggleControl, RangeControl = wp.components.RangeControl, TextControl = wp.components.TextControl, Button = wp.components.Button;
	var api = window.CNIMotionRegistryAPI;
	var editorConfig = window.CNIMotionEditorConfig || {};
	var attributeSchema = editorConfig.attributes || {};
	var categories = [{slug:'entrance',label:_x('— Entrance —','effect category','cni-motion')},{slug:'reveal',label:_x('— Reveal —','effect category','cni-motion')},{slug:'emphasis',label:_x('— Emphasis —','effect category','cni-motion')}];
	var frequentSlugs = ['fade','fade-up','zoom-in','blur-zoom-out','clip-reveal-left'];
	var triggerLabels = {auto:__('自動','cni-motion'),'site-ready':__('Site Ready','cni-motion'),scroll:__('スクロール','cni-motion'),hover:__('ホバー / フォーカス','cni-motion'),immediate:__('即時','cni-motion')};
	var speedValues = {fast:400,normal:600,slow:800,'very-slow':1200};
	var delayValues = [0,100,200,300,400,500,600,800,1000];
	var distanceValues = [8,16,24,40];
	var staggerValues = [50,100,150,200,300,400];

	function addAttributes(settings, name) {
		if (!api || !api.matrix[name]) return settings;
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

	function withInspector(BlockEdit) {
		return function (props) {
			if (!api || !api.matrix[props.name]) return el(BlockEdit, props);
			var a = props.attributes, set = props.setAttributes, enabled = !!a.cniMotionEnabled;
			var definition = api.get(a.cniMotionEffect) || api.get('fade');
			var canReplay = !!definition && api.supportsEffect(props.name, a.cniMotionEffect);
			var basicControls = [el(ToggleControl,{label:__('アニメーション','cni-motion'),checked:enabled,onChange:function(v){set({cniMotionEnabled:v});},key:'enabled'})];
			var detailControls = [];
			if (enabled) {
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
			return el(Fragment,null,el(BlockEdit,props),el(InspectorControls,null,el(PanelBody,{title:__('CNI Motion','cni-motion'),initialOpen:false},basicControls),enabled && el(PanelBody,{title:__('詳細設定','cni-motion'),initialOpen:false},detailControls)));
		};
	}
	wp.hooks.addFilter('editor.BlockEdit','cni-motion/inspector',wp.compose.createHigherOrderComponent(withInspector,'withCniMotionInspector'));
}(window.wp));
