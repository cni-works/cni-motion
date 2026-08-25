(function () {
	'use strict';
	var root = document.documentElement;
	var loaderBootstrap = window.CNIMotionLoaderBootstrap;
	var bootstrapExpired = window.cniMotionLoaderBootstrapExpired === true;
	var loaderExpected = !bootstrapExpired && !!(loaderBootstrap && typeof loaderBootstrap === 'object' && loaderBootstrap.enabled !== false);
	var loaderSkipped = false;
	function clearBootstrapCover() {
		var state = root.cniLoaderBootstrapCover;
		var style = document.getElementById('cni-motion-early-loader-css');
		root.classList.remove('cni-loader-booting');
		if (state) {
			if (state.background) root.style.setProperty('--cni-loader-bg', state.background, state.backgroundPriority);
			else root.style.removeProperty('--cni-loader-bg');
			root.cniLoaderBootstrapCover = null;
		}
		if (style && style.parentNode) style.parentNode.removeChild(style);
	}
	window.cniMotionClearBootstrapCover = clearBootstrapCover;
	root.classList.add('cni-motion-js');
	if (window.CNIMotionReducedMotion) root.classList.add('cni-motion-reduced-enabled');
	window.cniMotionSiteReady = window.cniMotionSiteReady || function () {
		if (window.cniMotionSiteReadySent) return;
		window.cniMotionSiteReadySent = true;
		root.classList.add('cni-site-ready');
		document.dispatchEvent(new CustomEvent('cni:site-ready'));
	};
	try {
		var frequency = loaderExpected ? loaderBootstrap.frequency : window.CNIMotionLoaderFrequency;
		loaderSkipped = (frequency === 'session' && sessionStorage.getItem('cni_motion_loader_session_v1')) || (frequency === 'first-visit' && localStorage.getItem('cni_motion_loader_seen_v1'));
		if (loaderSkipped) {
			root.classList.add('cni-loader-skip'); clearBootstrapCover();
			if (window.cniMotionEarlyCoverFailSafe) window.clearTimeout(window.cniMotionEarlyCoverFailSafe);
			window.cniMotionEarlyCoverFailSafe = null;
		}
	} catch (ignore) {}
	if (loaderExpected && !loaderSkipped) {
		if (!root.cniLoaderBootstrapCover) root.cniLoaderBootstrapCover = {
			background: root.style.getPropertyValue('--cni-loader-bg'),
			backgroundPriority: root.style.getPropertyPriority('--cni-loader-bg')
		};
		root.style.setProperty('--cni-loader-bg', typeof loaderBootstrap.backgroundColor === 'string' && loaderBootstrap.backgroundColor ? loaderBootstrap.backgroundColor : '#fff');
		root.classList.add('cni-loader-booting');
	}
	var failSafeDelay = window.cniMotionEarlyBootstrapAt ? Math.max(0, 10000 - (Date.now() - window.cniMotionEarlyBootstrapAt)) : 10000;
	function failSafe() {
		window.cniMotionLoaderBootstrapExpired = true;
		clearBootstrapCover();
		root.classList.remove('cni-motion-js', 'cni-loader-js-ready', 'cni-loader-skip');
		if (window.CNIMotionLoaderRuntime && typeof window.CNIMotionLoaderRuntime.unlockScroll === 'function') window.CNIMotionLoaderRuntime.unlockScroll(root);
		else root.classList.remove('cni-loader-lock');
		var loader = document.querySelector('.cni-loader');
		if (loader) loader.remove();
		window.cniMotionSiteReady();
	}
	window.cniMotionFailSafe = window.cniMotionEarlyCoverFailSafe || window.setTimeout(failSafe, failSafeDelay);
	if (!bootstrapExpired) root.classList.add('cni-loader-js-ready');
}());
