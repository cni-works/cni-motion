<?php
namespace CNI\Motion;
defined( 'ABSPATH' ) || exit;
final class Assets {
	public static function init(): void { add_action( 'wp_head', array( __CLASS__, 'early_loader_cover' ), -1000 ); add_action( 'wp_enqueue_scripts', array( __CLASS__, 'front' ) ); add_action( 'enqueue_block_assets', array( __CLASS__, 'block_editor_styles' ) ); add_action( 'enqueue_block_editor_assets', array( __CLASS__, 'editor' ) ); add_action( 'admin_enqueue_scripts', array( __CLASS__, 'admin' ) ); }
	private static function version( string $path ): string {
		$file = CNI_MOTION_DIR . ltrim( $path, '/' );
		$modified = is_file( $file ) ? filemtime( $file ) : false;
		return CNI_MOTION_VERSION . ( false !== $modified ? '.' . $modified : '' );
	}
	private static function loader_bootstrap_config( array $settings ): array {
		return array(
			'enabled'         => true,
			'frequency'       => $settings['loader']['frequency'],
			'backgroundColor' => $settings['loader']['backgroundColor'],
			'reducedMotion'   => (bool) $settings['general']['reducedMotion'],
		);
	}
	public static function early_loader_cover(): void {
		if ( is_admin() ) return;
		$settings = Settings::get();
		if ( ! Loader::should_output( $settings ) ) return;
		$config = wp_json_encode( self::loader_bootstrap_config( $settings ) );
		$script = sprintf(
			<<<'JS'
(function(w,d,c){'use strict';var r=d.documentElement,skipped=false,state;w.CNIMotionLoaderBootstrap=c;w.CNIMotionLoaderFrequency=c.frequency;if(c.reducedMotion)r.classList.add('cni-motion-reduced-enabled');try{skipped=(c.frequency==='session'&&w.sessionStorage.getItem('cni_motion_loader_session_v1'))||(c.frequency==='first-visit'&&w.localStorage.getItem('cni_motion_loader_seen_v1'));}catch(ignore){}if(skipped){r.classList.add('cni-loader-skip');return;}function clear(){var style;state=r.cniLoaderBootstrapCover;r.classList.remove('cni-loader-booting');if(state){if(state.background)r.style.setProperty('--cni-loader-bg',state.background,state.backgroundPriority);else r.style.removeProperty('--cni-loader-bg');r.cniLoaderBootstrapCover=null;}style=d.getElementById('cni-motion-early-loader-css');if(style&&style.parentNode)style.parentNode.removeChild(style);}function fail(){var loader;if(w.cniMotionEarlyCoverFailSafe)w.clearTimeout(w.cniMotionEarlyCoverFailSafe);if(w.cniMotionFailSafe&&w.cniMotionFailSafe!==w.cniMotionEarlyCoverFailSafe)w.clearTimeout(w.cniMotionFailSafe);w.cniMotionEarlyCoverFailSafe=null;w.cniMotionFailSafe=null;w.cniMotionLoaderBootstrapExpired=true;clear();if(w.CNIMotionLoaderRuntime&&typeof w.CNIMotionLoaderRuntime.unlockScroll==='function')w.CNIMotionLoaderRuntime.unlockScroll(r);else r.classList.remove('cni-loader-lock');r.classList.remove('cni-motion-js','cni-loader-js-ready');loader=d.querySelector('.cni-loader');if(loader)loader.remove();if(typeof w.cniMotionSiteReady==='function')w.cniMotionSiteReady();else if(!w.cniMotionSiteReadySent){w.cniMotionSiteReadySent=true;r.classList.add('cni-site-ready');try{d.dispatchEvent(new w.CustomEvent('cni:site-ready'));}catch(ignore){}}}if(!r.cniLoaderBootstrapCover)r.cniLoaderBootstrapCover={background:r.style.getPropertyValue('--cni-loader-bg'),backgroundPriority:r.style.getPropertyPriority('--cni-loader-bg')};r.style.setProperty('--cni-loader-bg',c.backgroundColor);r.classList.add('cni-loader-booting');w.cniMotionClearBootstrapCover=clear;w.cniMotionLoaderBootFail=fail;w.cniMotionEarlyBootstrapAt=Date.now();w.cniMotionEarlyCoverFailSafe=w.setTimeout(fail,10000);d.addEventListener('DOMContentLoaded',function(){if(!d.querySelector('.cni-loader'))fail();},{once:true});})(window,document,%s);
JS,
			$config
		);
		echo '<style id="cni-motion-early-loader-css" data-noptimize="1" data-no-optimize="1">html.cni-loader-booting::before{background:var(--cni-loader-bg,#fff);content:"";inset:0;pointer-events:none;position:fixed;z-index:999998}</style>';
		wp_print_inline_script_tag(
			$script,
			array( 'id' => 'cni-motion-early-loader-js', 'data-cfasync' => 'false', 'data-noptimize' => '1', 'data-no-optimize' => '1', 'data-no-defer' => '1', 'data-wpfc-render' => 'false' )
		);
		$preload_url = Loader::content_image_url( $settings['loader'] );
		if ( $preload_url ) printf( '<link rel="preload" as="image" href="%s" fetchpriority="high" data-noptimize="1" data-no-optimize="1">', esc_url( $preload_url ) );
	}
	public static function block_editor_styles(): void { if ( is_admin() ) wp_enqueue_style( 'cni-motion', CNI_MOTION_URL . 'assets/css/motion.css', array(), self::version( 'assets/css/motion.css' ) ); }
	public static function front(): void {
		if ( is_admin() ) return; $s = Settings::get(); if ( empty( $s['general']['enabled'] ) ) return;
		$loader_enabled = Loader::should_output( $s );
		wp_enqueue_style( 'cni-motion', CNI_MOTION_URL . 'assets/css/motion.css', array(), self::version( 'assets/css/motion.css' ) );
		if ( $loader_enabled ) wp_add_inline_style( 'cni-motion', '@media(max-width:' . absint( $s['defaults']['breakpoint'] ) . 'px){.cni-loader__logo img,.cni-loader__image{max-width:var(--cni-logo-mobile,180px)}.cni-loader__site-title{font-size:var(--cni-title-mobile,32px)}}' );
		wp_enqueue_script( 'cni-motion-bootstrap', CNI_MOTION_URL . 'assets/js/bootstrap.js', array(), self::version( 'assets/js/bootstrap.js' ), false );
		if ( $loader_enabled ) {
			$loader_bootstrap = self::loader_bootstrap_config( $s );
			wp_add_inline_script( 'cni-motion-bootstrap', 'window.CNIMotionLoaderBootstrap=' . wp_json_encode( $loader_bootstrap ) . ';window.CNIMotionLoaderFrequency=' . wp_json_encode( $s['loader']['frequency'] ) . ';', 'before' );
		}
		wp_add_inline_script( 'cni-motion-bootstrap', 'window.CNIMotionReducedMotion=' . wp_json_encode( (bool) $s['general']['reducedMotion'] ) . ';', 'before' );
		wp_enqueue_script( 'cni-motion-registry', CNI_MOTION_URL . 'assets/js/registry.js', array(), self::version( 'assets/js/registry.js' ), true );
		wp_add_inline_script( 'cni-motion-registry', 'window.CNIMotionRegistryData=' . wp_json_encode( Effect_Registry::client_data() ) . ';', 'before' );
		$dependencies = array( 'cni-motion-registry' );
		if ( $loader_enabled ) {
			wp_enqueue_script( 'cni-motion-loader-runtime', CNI_MOTION_URL . 'assets/js/loader-runtime.js', array(), self::version( 'assets/js/loader-runtime.js' ), true );
			$dependencies[] = 'cni-motion-loader-runtime';
		}
		wp_enqueue_script( 'cni-motion', CNI_MOTION_URL . 'assets/js/frontend.js', $dependencies, self::version( 'assets/js/frontend.js' ), true );
		wp_add_inline_script( 'cni-motion', 'window.CNIMotion=' . wp_json_encode( array( 'breakpoint' => $s['defaults']['breakpoint'], 'reducedMotion' => $s['general']['reducedMotion'] ) ) . ';', 'before' );
		wp_enqueue_script( 'cni-motion-text', CNI_MOTION_URL . 'assets/js/text-motion.js', array( 'cni-motion' ), self::version( 'assets/js/text-motion.js' ), true );
		wp_add_inline_script( 'cni-motion-text', 'window.CNIMotionTextData=' . wp_json_encode( Text_Motion_Registry::client_data() ) . ';', 'before' );
		wp_enqueue_script( 'cni-motion-parallax', CNI_MOTION_URL . 'assets/js/parallax.js', array( 'cni-motion' ), self::version( 'assets/js/parallax.js' ), true );
	}
	public static function editor(): void {
		wp_enqueue_style( 'cni-motion', CNI_MOTION_URL . 'assets/css/motion.css', array(), self::version( 'assets/css/motion.css' ) );
		wp_enqueue_style( 'cni-motion-editor', CNI_MOTION_URL . 'assets/css/editor.css', array( 'cni-motion' ), self::version( 'assets/css/editor.css' ) );
		wp_enqueue_script( 'cni-motion-registry', CNI_MOTION_URL . 'assets/js/registry.js', array(), self::version( 'assets/js/registry.js' ), true );
		wp_add_inline_script(
			'cni-motion-registry',
			'window.CNIMotionRegistryData=' . wp_json_encode( Effect_Registry::client_data() )
			. ';window.CNIMotionEditorConfig=' . wp_json_encode(
				array(
					'attributes'      => Block_Attributes::schema(),
					'parallax'        => Parallax::client_data(),
					'blockTools'      => Block_Tools::client_data(),
					'modules'         => Settings::get()['modules'],
					'canUseCustomCss' => current_user_can( 'unfiltered_html' ),
				)
			)
			. ';',
			'before'
		);
		wp_enqueue_script( 'cni-motion-text', CNI_MOTION_URL . 'assets/js/text-motion.js', array(), self::version( 'assets/js/text-motion.js' ), true );
		wp_add_inline_script( 'cni-motion-text', 'window.CNIMotionTextData=' . wp_json_encode( Text_Motion_Registry::client_data() ) . ';window.CNIMotionTextEditor=true;', 'before' );
		wp_enqueue_script( 'cni-motion-text-accent-editor', CNI_MOTION_URL . 'assets/js/text-accent-editor.js', array( 'cni-motion-text', 'wp-rich-text', 'wp-block-editor', 'wp-components', 'wp-element', 'wp-i18n', 'wp-data' ), self::version( 'assets/js/text-accent-editor.js' ), true );
		wp_enqueue_script( 'cni-motion-custom-css-preview', CNI_MOTION_URL . 'assets/js/custom-css-preview.js', array(), self::version( 'assets/js/custom-css-preview.js' ), true );
		wp_enqueue_script( 'cni-motion-editor', CNI_MOTION_URL . 'assets/js/editor.js', array( 'cni-motion-registry','cni-motion-text','cni-motion-text-accent-editor','cni-motion-custom-css-preview','wp-blocks','wp-compose','wp-components','wp-element','wp-i18n','wp-block-editor','wp-data','wp-hooks' ), self::version( 'assets/js/editor.js' ), true );
		wp_set_script_translations( 'cni-motion-editor', 'cni-motion', CNI_MOTION_DIR . 'languages' );
	}
	public static function admin( string $hook ): void {
		if ( 'settings_page_cni-motion' !== $hook ) return;
		$s = Settings::get();
		wp_enqueue_style( 'cni-motion', CNI_MOTION_URL . 'assets/css/motion.css', array(), self::version( 'assets/css/motion.css' ) );
		wp_add_inline_style( 'cni-motion', '@media(max-width:' . absint( $s['defaults']['breakpoint'] ) . 'px){.cni-loader__logo img,.cni-loader__image{max-width:var(--cni-logo-mobile,180px)}.cni-loader__site-title{font-size:var(--cni-title-mobile,32px)}}' );
		wp_enqueue_style( 'cni-motion-admin', CNI_MOTION_URL . 'assets/css/admin.css', array( 'cni-motion' ), self::version( 'assets/css/admin.css' ) );
		wp_enqueue_media();
		wp_enqueue_script( 'cni-motion-loader-runtime', CNI_MOTION_URL . 'assets/js/loader-runtime.js', array(), self::version( 'assets/js/loader-runtime.js' ), true );
		wp_enqueue_script( 'cni-motion-admin', CNI_MOTION_URL . 'assets/js/admin.js', array( 'wp-i18n', 'cni-motion-loader-runtime' ), self::version( 'assets/js/admin.js' ), true );
		wp_set_script_translations( 'cni-motion-admin', 'cni-motion', CNI_MOTION_DIR . 'languages' );
		wp_add_inline_script( 'cni-motion-admin', 'window.CNIMotionLoaderAdmin=' . wp_json_encode( array( 'presets' => Settings::loader_presets(), 'siteTitle' => get_bloginfo( 'name' ), 'customImageUrl' => wp_get_attachment_image_url( absint( $s['loader']['customImageId'] ), 'full' ) ?: '', 'reducedMotion' => (bool) $s['general']['reducedMotion'] ) ) . ';', 'before' );
	}
}
