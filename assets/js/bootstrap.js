(function () {
	'use strict';
	var root = document.documentElement;
	root.classList.add('cni-motion-js');
	if (window.CNIMotionReducedMotion) root.classList.add('cni-motion-reduced-enabled');
	window.cniMotionSiteReady = window.cniMotionSiteReady || function () {
		if (window.cniMotionSiteReadySent) return;
		window.cniMotionSiteReadySent = true;
		root.classList.add('cni-site-ready');
		document.dispatchEvent(new CustomEvent('cni:site-ready'));
	};
	try {
		var frequency = window.CNIMotionLoaderFrequency;
		if ((frequency === 'session' && sessionStorage.getItem('cni_motion_loader_session_v1')) || (frequency === 'first-visit' && localStorage.getItem('cni_motion_loader_seen_v1'))) root.classList.add('cni-loader-skip');
	} catch (ignore) {}
	window.cniMotionFailSafe = window.setTimeout(function () {
		root.classList.remove('cni-motion-js', 'cni-loader-js-ready');
		if (window.CNIMotionLoaderRuntime && typeof window.CNIMotionLoaderRuntime.unlockScroll === 'function') window.CNIMotionLoaderRuntime.unlockScroll(root);
		else root.classList.remove('cni-loader-lock');
		var loader = document.querySelector('.cni-loader');
		if (loader) loader.remove();
		window.cniMotionSiteReady();
	}, 10000);
	root.classList.add('cni-loader-js-ready');
}());
