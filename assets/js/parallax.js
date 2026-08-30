(function (window, document) {
	'use strict';
	var config = window.CNIMotion || {};
	var presets = { subtle:{distance:12,scale:1.06}, standard:{distance:24,scale:1.10}, strong:{distance:40,scale:1.14} };
	var instances=[], active=new Set(), observer=null, resizeObserver=null, frame=0, needsMeasure=true, ready=false;
	var reduceQuery=window.matchMedia?window.matchMedia('(prefers-reduced-motion: reduce)'):null;
	function clamp(value,min,max){return Math.max(min,Math.min(max,value));}
	function isReduced(){return !!config.reducedMotion&&!!reduceQuery&&reduceQuery.matches;}
	function isMobile(){return window.innerWidth<=(parseInt(config.breakpoint,10)||768);}
	function isEligible(instance){return !isReduced()&&(!isMobile()||instance.mobile);}
	function clearVisual(instance){instance.current=null;instance.target.classList.remove('cni-parallax__media');instance.target.style.removeProperty('--cni-parallax-y');instance.target.style.removeProperty('--cni-parallax-scale');instance.target.style.willChange='';if(instance.container)instance.container.classList.remove('cni-parallax__viewport');}
	function measure(instance){
		var rootRect=instance.root.getBoundingClientRect(),targetRect=instance.target.getBoundingClientRect();
		var viewport=Math.max(document.documentElement.clientHeight||0,window.innerHeight||0);
		var progress=clamp((viewport-rootRect.top)/Math.max(1,viewport+rootRect.height),0,1);
		var desiredScale=Math.max(instance.preset.scale,1+((instance.preset.distance*2+4)/Math.max(1,targetRect.height)));
		instance.scale=Math.min(1.32,desiredScale);
		var overdraw=Math.max(0,(targetRect.height*(instance.scale-1))/2-2);
		var safeDistance=Math.min(instance.preset.distance,overdraw);
		instance.destination=(progress-0.5)*2*safeDistance*(instance.reverse?-1:1);
	}
	function draw(){
		frame=0;var moving=false;
		active.forEach(function(instance){
			if(!ready||!isEligible(instance)){clearVisual(instance);return;}
			if(needsMeasure||instance.current===null)measure(instance);
			if(instance.current===null)instance.current=instance.destination;else instance.current+=(instance.destination-instance.current)*0.10;
			if(Math.abs(instance.destination-instance.current)<0.05)instance.current=instance.destination;else moving=true;
			instance.target.classList.add('cni-parallax__media');
			if(instance.container)instance.container.classList.add('cni-parallax__viewport');
			instance.target.style.setProperty('--cni-parallax-y',instance.current.toFixed(2)+'px');
			instance.target.style.setProperty('--cni-parallax-scale',instance.scale.toFixed(4));
			instance.target.style.willChange=moving?'translate, scale':'';
		});
		needsMeasure=false;if(moving)frame=window.requestAnimationFrame(draw);
	}
	function schedule(measureAgain){if(measureAgain)needsMeasure=true;if(!frame)frame=window.requestAnimationFrame(draw);}
	function activate(instance){active.add(instance);schedule(true);}
	function deactivate(instance){active.delete(instance);instance.target.style.willChange='';}
	function create(root){
		var selector=root.getAttribute('data-cni-parallax-selector'),target;
		try{target=selector?root.querySelector(selector):null;}catch(ignore){target=null;}
		if(!target)return null;
		var strength=root.getAttribute('data-cni-parallax');if(!presets[strength])strength='standard';
		var instance={root:root,target:target,preset:presets[strength],reverse:root.getAttribute('data-cni-parallax-direction')==='reverse',mobile:root.getAttribute('data-cni-parallax-mobile')==='true',current:null,destination:0,scale:1,container:null};
		var containerSelector=root.getAttribute('data-cni-parallax-container'),container=null;
		try{container=containerSelector?root.querySelector(containerSelector):null;}catch(ignoreContainer){}
		instance.container=container;instances.push(instance);return instance;
	}
	function start(){
		if(ready)return;ready=true;
		if('IntersectionObserver' in window){observer=new window.IntersectionObserver(function(entries){entries.forEach(function(entry){var instance=entry.target.cniParallaxInstance;if(!instance)return;if(entry.isIntersecting)activate(instance);else deactivate(instance);});},{rootMargin:'160px 0px'});instances.forEach(function(instance){instance.root.cniParallaxInstance=instance;observer.observe(instance.root);});}else instances.forEach(activate);
		if('ResizeObserver' in window){resizeObserver=new window.ResizeObserver(function(){schedule(true);});instances.forEach(function(instance){resizeObserver.observe(instance.root);});}
		schedule(true);
	}
	function init(){
		document.querySelectorAll('[data-cni-parallax]').forEach(create);if(!instances.length)return;
		window.addEventListener('scroll',function(){schedule(true);},{passive:true});window.addEventListener('resize',function(){schedule(true);},{passive:true});
		if(reduceQuery){if(typeof reduceQuery.addEventListener==='function')reduceQuery.addEventListener('change',function(){schedule(true);});else if(typeof reduceQuery.addListener==='function')reduceQuery.addListener(function(){schedule(true);});}
		if(window.cniMotionSiteReadySent||document.documentElement.classList.contains('cni-site-ready'))start();else document.addEventListener('cni:site-ready',start,{once:true});
	}
	window.CNIMotionParallaxAPI={init:init,presets:presets};
	if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
}(window, document));
