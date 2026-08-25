<?php
namespace CNI\Motion;
defined( 'ABSPATH' ) || exit;
final class Assets {
	public static function init(): void { add_action( 'wp_enqueue_scripts', array( __CLASS__, 'front' ) ); add_action( 'enqueue_block_assets', array( __CLASS__, 'block_editor_styles' ) ); add_action( 'enqueue_block_editor_assets', array( __CLASS__, 'editor' ) ); add_action( 'admin_enqueue_scripts', array( __CLASS__, 'admin' ) ); }
	private static function version( string $path ): string {
		$file = CNI_MOTION_DIR . ltrim( $path, '/' );
		$modified = is_file( $file ) ? filemtime( $file ) : false;
		return CNI_MOTION_VERSION . ( false !== $modified ? '.' . $modified : '' );
	}
	public static function block_editor_styles(): void { if ( is_admin() ) wp_enqueue_style( 'cni-motion', CNI_MOTION_URL . 'assets/css/motion.css', array(), self::version( 'assets/css/motion.css' ) ); }
	public static function front(): void {
		if ( is_admin() ) return; $s = Settings::get(); if ( empty( $s['general']['enabled'] ) ) return;
		$loader_enabled = Loader::should_output( $s );
		wp_enqueue_style( 'cni-motion', CNI_MOTION_URL . 'assets/css/motion.css', array(), self::version( 'assets/css/motion.css' ) );
		if ( $loader_enabled ) wp_add_inline_style( 'cni-motion', '@media(max-width:' . absint( $s['defaults']['breakpoint'] ) . 'px){.cni-loader__logo img{max-width:var(--cni-logo-mobile,180px)}.cni-loader__site-title{font-size:var(--cni-title-mobile,32px)}}' );
		wp_enqueue_script( 'cni-motion-bootstrap', CNI_MOTION_URL . 'assets/js/bootstrap.js', array(), self::version( 'assets/js/bootstrap.js' ), false );
		if ( $loader_enabled ) wp_add_inline_script( 'cni-motion-bootstrap', 'window.CNIMotionLoaderFrequency=' . wp_json_encode( $s['loader']['frequency'] ) . ';', 'before' );
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
	}
	public static function editor(): void {
		wp_enqueue_style( 'cni-motion', CNI_MOTION_URL . 'assets/css/motion.css', array(), self::version( 'assets/css/motion.css' ) );
		wp_enqueue_style( 'cni-motion-editor', CNI_MOTION_URL . 'assets/css/editor.css', array( 'cni-motion' ), self::version( 'assets/css/editor.css' ) );
		wp_enqueue_script( 'cni-motion-registry', CNI_MOTION_URL . 'assets/js/registry.js', array(), self::version( 'assets/js/registry.js' ), true );
		wp_add_inline_script( 'cni-motion-registry', 'window.CNIMotionRegistryData=' . wp_json_encode( Effect_Registry::client_data() ) . ';window.CNIMotionEditorConfig=' . wp_json_encode( array( 'attributes' => Block_Attributes::schema() ) ) . ';', 'before' );
		wp_enqueue_script( 'cni-motion-editor', CNI_MOTION_URL . 'assets/js/editor.js', array( 'cni-motion-registry','wp-blocks','wp-compose','wp-components','wp-element','wp-i18n','wp-block-editor','wp-hooks' ), self::version( 'assets/js/editor.js' ), true );
		wp_set_script_translations( 'cni-motion-editor', 'cni-motion', CNI_MOTION_DIR . 'languages' );
	}
	public static function admin( string $hook ): void {
		if ( 'settings_page_cni-motion' !== $hook ) return;
		$s = Settings::get(); $logo_id = absint( get_theme_mod( 'custom_logo' ) );
		wp_enqueue_style( 'cni-motion', CNI_MOTION_URL . 'assets/css/motion.css', array(), self::version( 'assets/css/motion.css' ) );
		wp_add_inline_style( 'cni-motion', '@media(max-width:' . absint( $s['defaults']['breakpoint'] ) . 'px){.cni-loader__logo img{max-width:var(--cni-logo-mobile,180px)}.cni-loader__site-title{font-size:var(--cni-title-mobile,32px)}}' );
		wp_enqueue_style( 'cni-motion-admin', CNI_MOTION_URL . 'assets/css/admin.css', array( 'cni-motion' ), self::version( 'assets/css/admin.css' ) );
		wp_enqueue_media();
		wp_enqueue_script( 'cni-motion-loader-runtime', CNI_MOTION_URL . 'assets/js/loader-runtime.js', array(), self::version( 'assets/js/loader-runtime.js' ), true );
		wp_enqueue_script( 'cni-motion-admin', CNI_MOTION_URL . 'assets/js/admin.js', array( 'wp-i18n', 'cni-motion-loader-runtime' ), self::version( 'assets/js/admin.js' ), true );
		wp_set_script_translations( 'cni-motion-admin', 'cni-motion', CNI_MOTION_DIR . 'languages' );
		wp_add_inline_script( 'cni-motion-admin', 'window.CNIMotionLoaderAdmin=' . wp_json_encode( array( 'presets' => Settings::loader_presets(), 'siteTitle' => get_bloginfo( 'name' ), 'siteLogoUrl' => $logo_id ? wp_get_attachment_image_url( $logo_id, 'full' ) : '', 'customImageUrl' => wp_get_attachment_image_url( absint( $s['loader']['customImageId'] ), 'full' ) ?: '', 'reducedMotion' => (bool) $s['general']['reducedMotion'] ) ) . ';', 'before' );
	}
}
