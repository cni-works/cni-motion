(function () {
	'use strict';
	var data = window.CNIMotionRegistryData || {};
	var allowedCategories = ['entrance','reveal','emphasis'];
	var allowedTriggers = ['auto','site-ready','scroll','hover','immediate'];
	function validEffect(effect) {
		return !!effect && typeof effect === 'object' && typeof effect.slug === 'string' && effect.slug !== '' && allowedCategories.indexOf(effect.category) !== -1 && typeof effect.label === 'string' && Number.isFinite(effect.defaultDuration) && typeof effect.defaultEasing === 'string' && (effect.defaultDistance === null || Number.isFinite(effect.defaultDistance)) && !!effect.supports && typeof effect.supports === 'object' && !Array.isArray(effect.supports) && Array.isArray(effect.triggers) && effect.triggers.length > 0 && effect.triggers.every(function (trigger) { return allowedTriggers.indexOf(trigger) !== -1; }) && typeof effect.reducedMotionFallback === 'string';
	}
	var effects = Array.isArray(data.effects) ? data.effects.filter(validEffect) : [];
	var matrix = data.blockMatrix && typeof data.blockMatrix === 'object' && !Array.isArray(data.blockMatrix) ? data.blockMatrix : {};
	var elementTargets = data.elementTargets && typeof data.elementTargets === 'object' && !Array.isArray(data.elementTargets) ? data.elementTargets : {};
	var bySlug = {};
	effects.forEach(function (effect) { bySlug[effect.slug] = effect; });

	function supportsEffect(blockName, effect) {
		var support = matrix[blockName];
		if (!support || !effect) return false;
		if (effect.category === 'reveal') return effect.supports && effect.supports.maskColor ? !!support.mask : !!support.clip;
		return !!support[effect.category];
	}
	function supportsTarget(target, effect) {
		var support = elementTargets[target];
		if (!support || !effect) return false;
		if (effect.category === 'reveal') return effect.supports && effect.supports.maskColor ? !!support.mask : !!support.clip;
		return !!support[effect.category];
	}

	window.CNIMotionRegistry = effects;
	window.CNIMotionBlockSupport = matrix;
	window.CNIMotionRegistryAPI = {
		all: effects,
		matrix: matrix,
		get: function (slug) { return bySlug[slug] || null; },
		forBlock: function (blockName) { return effects.filter(function (effect) { return supportsEffect(blockName, effect); }); },
		forTarget: function (target) { return effects.filter(function (effect) { return supportsTarget(target, effect); }); },
		supportsEffect: function (blockName, slug) { return supportsEffect(blockName, bySlug[slug]); },
		supportsTargetEffect: function (target, slug) { return supportsTarget(target, bySlug[slug]); },
		supportsStagger: function (blockName) { return !!(matrix[blockName] && matrix[blockName].stagger); }
	};
	try { document.dispatchEvent(new CustomEvent('cni:motion-registry-ready')); } catch (ignore) {}
}());
