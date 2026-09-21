<?php
namespace CNI\Motion;
defined( 'ABSPATH' ) || exit;
final class Loader {
	public static function init(): void { add_action( 'wp_body_open', array( __CLASS__, 'output' ), 1 ); }
	public static function should_output( ?array $settings = null ): bool {
		if ( is_admin() ) return false;
		$s = $settings ?? Settings::get();
		$l = $s['loader'];
		if ( empty( $s['general']['enabled'] ) || empty( $l['enabled'] ) ) return false;
		if ( 'front-page' === $l['scope'] && ! is_front_page() ) return false;
		if ( ! empty( $l['skipAdmin'] ) && current_user_can( 'manage_options' ) ) return false;
		return true;
	}
	public static function output(): void {
		$s = Settings::get();
		if ( ! self::should_output( $s ) ) return;
		$l = $s['loader'];
		$content = self::content( $l );
		$style = sprintf(
			'--cni-loader-bg:%1$s;--cni-enter:%2$dms;--cni-logo-desktop:%3$dpx;--cni-logo-mobile:%4$dpx;--cni-title-desktop:%5$dpx;--cni-title-mobile:%6$dpx;--cni-title-weight:%7$d;--cni-title-spacing:%8$sem;--cni-title-color:%9$s',
			esc_attr( $l['backgroundColor'] ), absint( $l['contentEnterDuration'] ), absint( $l['logoDesktopWidth'] ), absint( $l['logoMobileWidth'] ), absint( $l['siteTitleDesktopFontSize'] ), absint( $l['siteTitleMobileFontSize'] ), absint( $l['siteTitleFontWeight'] ), esc_attr( (string) $l['siteTitleLetterSpacing'] ), esc_attr( $l['siteTitleTextColor'] )
		);
		printf(
			'<div class="cni-loader" aria-hidden="true" data-cni-loader="%1$s" data-cni-frequency="%2$s" data-cni-loader-enter="%3$s" data-cni-loader-exit="%4$s" data-cni-loader-hold="%5$d" data-cni-loader-enter-duration="%6$d" data-cni-loader-exit-duration="%7$d" data-cni-loader-reveal-duration="%8$d" data-cni-loader-max-wait="%9$d" data-cni-loader-state="idle" data-cni-content-layout="%10$s" style="%11$s"><div class="cni-loader__panel cni-loader__panel--a"></div><div class="cni-loader__panel cni-loader__panel--b"></div><div class="cni-loader__content">%12$s</div></div>',
			esc_attr( $l['siteReveal'] ), esc_attr( $l['frequency'] ), esc_attr( $l['contentEnter'] ), esc_attr( $l['contentExit'] ), absint( $l['holdDuration'] ), absint( $l['contentEnterDuration'] ), absint( $l['contentExitDuration'] ), absint( $l['siteRevealDuration'] ), absint( $l['maxWait'] ), esc_attr( $l['contentLayout'] ?? 'single' ), esc_attr( $style ), $content
		);
	}
	private static function content( array $l ): string {
		$layout = $l['contentLayout'] ?? 'single';
		if ( 'single' !== $layout ) {
			$items = array( self::logo( $l ) );
			if ( in_array( $layout, array( 'logo-text', 'logo-text-line' ), true ) ) $items[] = '<p class="cni-loader__text cni-loader__site-title cni-loader__brand-text">' . esc_html( $l['customText'] ) . '</p>';
			if ( in_array( $layout, array( 'logo-line', 'logo-text-line' ), true ) ) $items[] = '<span class="cni-loader__line"></span>';
			return '<div class="cni-loader__stack">' . implode( '', $items ) . '</div>';
		}
		switch ( $l['contentType'] ) {
			case 'site-logo': // Legacy slug; theme lookup was intentionally removed.
			case 'custom-image': return self::logo( $l );
			case 'site-title': return self::site_title();
			case 'custom-text': return '<p class="cni-loader__text">' . esc_html( $l['customText'] ) . '</p>';
			case 'line': return '<span class="cni-loader__line"></span>';
			case 'dots': return '<span class="cni-loader__dots"><i></i><i></i><i></i></span>';
			default: return '';
		}
	}
	private static function logo( array $l ): string {
		$url = wp_get_attachment_image_url( absint( $l['customImageId'] ), 'full' ) ?: '';
		return $url ? '<img class="cni-loader__image" src="' . esc_url( $url ) . '" alt="" loading="eager" fetchpriority="high" decoding="async">' : self::site_title();
	}
	public static function content_image_url( array $l ): string {
		$layout = $l['contentLayout'] ?? 'single';
		if ( 'single' !== $layout || in_array( $l['contentType'], array( 'site-logo', 'custom-image' ), true ) ) return wp_get_attachment_image_url( absint( $l['customImageId'] ), 'full' ) ?: '';
		return '';
	}
	private static function site_title(): string { $title = get_bloginfo( 'name' ); return $title ? '<p class="cni-loader__text cni-loader__site-title">' . esc_html( $title ) . '</p>' : ''; }
}
