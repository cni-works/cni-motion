<?php
namespace CNI\Motion;

defined( 'ABSPATH' ) || exit;

final class Settings {
	public const OPTION = 'cni_motion_settings';
	public const SCHEMA_VERSION = 2;

	public static function init(): void {
		add_action( 'admin_menu', array( __CLASS__, 'menu' ) );
		add_action( 'admin_init', array( __CLASS__, 'register' ) );
	}

	public static function defaults(): array {
		return array(
			'schemaVersion' => self::SCHEMA_VERSION,
			'general'       => array( 'enabled' => true, 'reducedMotion' => true, 'deleteOnUninstall' => false ),
			'modules'       => array( 'customCss' => false, 'visibility' => false ),
			'defaults'      => array( 'speed' => 'recommended', 'delay' => 0, 'mobileMotion' => true, 'mobileDelay' => false, 'breakpoint' => 768, 'offset' => 'normal' ),
			'loader'        => array_merge(
				array( 'enabled' => false, 'scope' => 'front-page', 'frequency' => 'session', 'skipAdmin' => true, 'preset' => 'classic-split', 'customImageId' => 0, 'customText' => '', 'siteTitleDesktopFontSize' => 48, 'siteTitleMobileFontSize' => 32, 'siteTitleFontWeight' => 700, 'siteTitleLetterSpacing' => 0.08, 'siteTitleTextColor' => '#000000', 'maxWait' => 3000 ),
				self::loader_presets()['classic-split']
			),
		);
	}

	public static function loader_presets(): array {
		$base = array(
			'contentType' => 'custom-image', 'logoDesktopWidth' => 300, 'logoMobileWidth' => 180,
			'contentEnterDuration' => 400, 'holdDuration' => 700,
			'contentExit' => 'fade-out', 'contentExitDuration' => 400,
			'backgroundColor' => '#ffffff', 'siteRevealDuration' => 500,
		);
		return array(
			'classic-split' => array_merge( $base, array( 'contentEnter' => 'fade', 'siteReveal' => 'split-horizontal' ) ),
			'minimal-fade' => array_merge( $base, array( 'contentEnter' => 'fade', 'holdDuration' => 500, 'siteReveal' => 'fade', 'siteRevealDuration' => 400 ) ),
			'brand-wipe' => array_merge( $base, array( 'contentEnter' => 'blur-in', 'siteReveal' => 'wipe-right' ) ),
			'circle' => array_merge( $base, array( 'contentEnter' => 'zoom-in', 'siteReveal' => 'circle-reveal' ) ),
		);
	}

	public static function get(): array {
		$value = get_option( self::OPTION, array() );
		$settings = array_replace_recursive( self::defaults(), is_array( $value ) ? $value : array() );
		/* Legacy Site Logo settings now use the plugin-selected image. */
		if ( 'site-logo' === $settings['loader']['contentType'] ) $settings['loader']['contentType'] = 'custom-image';
		return $settings;
	}

	public static function register(): void {
		register_setting( 'cni_motion', self::OPTION, array( 'sanitize_callback' => array( __CLASS__, 'sanitize' ), 'default' => self::defaults() ) );
	}

	public static function sanitize( $input ): array {
		$input = is_array( $input ) ? $input : array();
		$general = isset( $input['general'] ) && is_array( $input['general'] ) ? $input['general'] : array();
		$modules = isset( $input['modules'] ) && is_array( $input['modules'] ) ? $input['modules'] : array();
		$motion = isset( $input['defaults'] ) && is_array( $input['defaults'] ) ? $input['defaults'] : array();
		$loader = isset( $input['loader'] ) && is_array( $input['loader'] ) ? $input['loader'] : array();
		if ( 'site-logo' === ( $loader['contentType'] ?? '' ) || ! isset( $loader['contentType'] ) ) $loader['contentType'] = 'custom-image';
		$pick = static fn( $value, array $allowed, $fallback ) => in_array( $value, $allowed, true ) ? $value : $fallback;
		return array(
			'schemaVersion' => self::SCHEMA_VERSION,
			'general' => array( 'enabled' => ! empty( $general['enabled'] ), 'reducedMotion' => ! empty( $general['reducedMotion'] ), 'deleteOnUninstall' => ! empty( $general['deleteOnUninstall'] ) ),
			'modules' => array( 'customCss' => ! empty( $modules['customCss'] ), 'visibility' => ! empty( $modules['visibility'] ) ),
			'defaults' => array( 'speed' => $pick( $motion['speed'] ?? '', array( 'recommended','fast','normal','slow','very-slow' ), 'recommended' ), 'delay' => self::number( $motion['delay'] ?? 0, 0, 10000 ), 'mobileMotion' => ! empty( $motion['mobileMotion'] ), 'mobileDelay' => ! empty( $motion['mobileDelay'] ), 'breakpoint' => self::number( $motion['breakpoint'] ?? 768, 480, 1200 ), 'offset' => $pick( $motion['offset'] ?? '', array( 'early', 'normal', 'late' ), 'normal' ) ),
			'loader' => array(
				'enabled' => ! empty( $loader['enabled'] ), 'scope' => $pick( $loader['scope'] ?? '', array( 'front-page', 'all-pages' ), 'front-page' ), 'frequency' => $pick( $loader['frequency'] ?? '', array( 'always', 'session', 'first-visit' ), 'session' ), 'skipAdmin' => ! empty( $loader['skipAdmin'] ), 'preset' => $pick( $loader['preset'] ?? '', array_keys( self::loader_presets() ), 'classic-split' ), 'contentType' => $pick( $loader['contentType'] ?? '', array( 'site-logo', 'custom-image', 'site-title', 'custom-text', 'line', 'dots', 'none' ), 'site-logo' ), 'customImageId' => absint( $loader['customImageId'] ?? 0 ), 'customText' => sanitize_text_field( $loader['customText'] ?? '' ), 'logoDesktopWidth' => self::number( $loader['logoDesktopWidth'] ?? 300, 50, 800 ), 'logoMobileWidth' => self::number( $loader['logoMobileWidth'] ?? 180, 50, 800 ), 'siteTitleDesktopFontSize' => self::number( $loader['siteTitleDesktopFontSize'] ?? 48, 12, 200 ), 'siteTitleMobileFontSize' => self::number( $loader['siteTitleMobileFontSize'] ?? 32, 12, 200 ), 'siteTitleFontWeight' => self::font_weight( $loader['siteTitleFontWeight'] ?? 700 ), 'siteTitleLetterSpacing' => self::decimal( $loader['siteTitleLetterSpacing'] ?? 0.08, -0.1, 1.0 ), 'siteTitleTextColor' => sanitize_hex_color( $loader['siteTitleTextColor'] ?? '' ) ?: '#000000', 'contentEnter' => $pick( $loader['contentEnter'] ?? '', array( 'none', 'fade', 'fade-up', 'zoom-in', 'blur-in', 'clip-reveal' ), 'fade' ), 'contentEnterDuration' => self::number( $loader['contentEnterDuration'] ?? 400, 100, 5000 ), 'holdDuration' => self::number( $loader['holdDuration'] ?? 700, 0, 5000 ), 'contentExit' => $pick( $loader['contentExit'] ?? '', array( 'none', 'fade-out', 'zoom-out', 'blur-out', 'slide-up' ), 'fade-out' ), 'contentExitDuration' => self::number( $loader['contentExitDuration'] ?? 400, 100, 5000 ), 'backgroundColor' => sanitize_hex_color( $loader['backgroundColor'] ?? '' ) ?: '#ffffff', 'siteReveal' => $pick( $loader['siteReveal'] ?? '', array( 'fade', 'split-horizontal', 'split-vertical', 'wipe-left', 'wipe-right', 'wipe-up', 'wipe-down', 'circle-reveal' ), 'split-horizontal' ), 'siteRevealDuration' => self::number( $loader['siteRevealDuration'] ?? 500, 100, 5000 ), 'maxWait' => self::number( $loader['maxWait'] ?? 3000, 500, 10000 ),
			),
		);
	}
	private static function number( $value, int $min, int $max ): int { return max( $min, min( $max, absint( $value ) ) ); }
	private static function decimal( $value, float $min, float $max ): float { $number = is_numeric( $value ) ? (float) $value : 0.0; return max( $min, min( $max, $number ) ); }
	private static function font_weight( $value ): int { $weight = self::number( $value, 100, 900 ); return in_array( $weight, range( 100, 900, 100 ), true ) ? $weight : 700; }
	public static function menu(): void { add_options_page( __( 'CNI Motion', 'cni-motion' ), __( 'CNI Motion', 'cni-motion' ), 'manage_options', 'cni-motion', array( __CLASS__, 'page' ) ); }
	public static function page(): void { if ( ! current_user_can( 'manage_options' ) ) return; $s = self::get(); include CNI_MOTION_DIR . 'includes/views/settings-page.php'; }
}
