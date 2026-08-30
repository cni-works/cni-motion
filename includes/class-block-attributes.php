<?php
namespace CNI\Motion;

defined( 'ABSPATH' ) || exit;

final class Block_Attributes {
	public static function supports( string $name ): bool {
		return Effect_Registry::supports_block( $name );
	}

	public static function init(): void {
		add_filter( 'register_block_type_args', array( __CLASS__, 'attributes' ), 10, 2 );
		add_filter( 'render_block', array( __CLASS__, 'render' ), 10, 2 );
	}

	public static function schema(): array {
		$global = Settings::get()['defaults'];
		$offsets = array( 'early' => 0, 'normal' => 12, 'late' => 25 );
		$durations = array( 'recommended' => 600, 'fast' => 400, 'normal' => 600, 'slow' => 800, 'very-slow' => 1200 );
		$delay = (int) $global['delay'];
		$delay_mode = in_array( $delay, array( 0, 100, 200, 300, 400, 500, 600, 800, 1000 ), true ) ? 'preset' : 'custom';

		return array(
			'cniCustomCss' => array( 'type' => 'string', 'default' => '' ),
			'cniCssId' => array( 'type' => 'string', 'default' => '' ),
			'cniVisibility' => array( 'type' => 'string', 'default' => 'all' ),
			'cniParallaxEnabled' => array( 'type' => 'boolean', 'default' => false ),
			'cniParallaxStrength' => array( 'type' => 'string', 'default' => 'standard' ),
			'cniParallaxDirection' => array( 'type' => 'string', 'default' => 'normal' ),
			'cniParallaxMobile' => array( 'type' => 'boolean', 'default' => false ),
			'cniMotionEnabled' => array( 'type' => 'boolean', 'default' => false ),
			'cniMotionMode' => array( 'type' => 'string', 'default' => 'block' ),
			'cniMotionEffect' => array( 'type' => 'string', 'default' => 'fade' ),
			'cniMotionTrigger' => array( 'type' => 'string', 'default' => 'auto' ),
			'cniMotionSpeedMode' => array( 'type' => 'string', 'default' => $global['speed'] ),
			'cniMotionDuration' => array( 'type' => 'number', 'default' => $durations[ $global['speed'] ] ?? 600 ),
			'cniMotionDelayMode' => array( 'type' => 'string', 'default' => $delay_mode ),
			'cniMotionDelay' => array( 'type' => 'number', 'default' => $delay ),
			'cniMotionEasing' => array( 'type' => 'string', 'default' => 'recommended' ),
			'cniMotionDistanceMode' => array( 'type' => 'string', 'default' => 'effect-default' ),
			'cniMotionDistance' => array( 'type' => 'number', 'default' => 16 ),
			'cniMotionTriggerOffsetMode' => array( 'type' => 'string', 'default' => $global['offset'] ),
			'cniMotionTriggerOffset' => array( 'type' => 'number', 'default' => $offsets[ $global['offset'] ] ?? 12 ),
			'cniMotionOnce' => array( 'type' => 'boolean', 'default' => true ),
			'cniMotionMobile' => array( 'type' => 'boolean', 'default' => (bool) $global['mobileMotion'] ),
			'cniMotionMobileDelay' => array( 'type' => 'boolean', 'default' => (bool) $global['mobileDelay'] ),
			'cniMotionStagger' => array( 'type' => 'boolean', 'default' => false ),
			'cniMotionStaggerEffect' => array( 'type' => 'string', 'default' => 'fade-up' ),
			'cniMotionStaggerIntervalMode' => array( 'type' => 'string', 'default' => 'preset' ),
			'cniMotionStaggerInterval' => array( 'type' => 'number', 'default' => 150 ),
			'cniMotionMaskColor' => array( 'type' => 'string', 'default' => '#ffffff' ),
			'cniMotionIntensity' => array( 'type' => 'string', 'default' => 'standard' ),
			'cniMotionTextEffect' => array( 'type' => 'string', 'default' => 'character-fade-up' ),
			'cniMotionTextIntervalMode' => array( 'type' => 'string', 'default' => 'preset' ),
			'cniMotionTextInterval' => array( 'type' => 'number', 'default' => 70 ),
			'cniMotionTextDuration' => array( 'type' => 'number', 'default' => 600 ),
			'cniMotionMarqueeDirection' => array( 'type' => 'string', 'default' => 'left' ),
			'cniMotionMarqueeSpeedMode' => array( 'type' => 'string', 'default' => 'normal' ),
			'cniMotionMarqueeSpeed' => array( 'type' => 'number', 'default' => 50 ),
			'cniMotionMarqueeGapMode' => array( 'type' => 'string', 'default' => 'normal' ),
			'cniMotionMarqueeGap' => array( 'type' => 'number', 'default' => 48 ),
			'cniMotionMarqueeFade' => array( 'type' => 'boolean', 'default' => true ),
			'cniMotionMarqueePauseHover' => array( 'type' => 'boolean', 'default' => true ),
			'cniMotionMarqueeMobile' => array( 'type' => 'boolean', 'default' => true ),
		);
	}

	public static function attributes( array $args, string $name ): array {
		if ( ! self::supports( $name ) && ! Parallax::supports_block( $name ) && ! Block_Tools::supports_custom_css( $name ) && ! Block_Tools::supports_visibility( $name ) ) return $args;
		$args['attributes'] = array_merge( $args['attributes'] ?? array(), self::schema() );
		return $args;
	}

	private static function number( mixed $value, int $minimum, int $maximum, int $fallback ): int {
		$value = is_numeric( $value ) ? (int) $value : $fallback;
		return max( $minimum, min( $maximum, $value ) );
	}

	private static function boolean( mixed $value, bool $fallback ): bool {
		if ( is_bool( $value ) ) return $value;
		if ( 1 === $value || 1.0 === $value ) return true;
		if ( 0 === $value || 0.0 === $value ) return false;
		if ( is_string( $value ) ) {
			$value = strtolower( trim( $value ) );
			if ( '1' === $value || 'true' === $value ) return true;
			if ( '0' === $value || 'false' === $value ) return false;
		}
		return $fallback;
	}

	public static function render( string $html, array $block ): string {
		$a = $block['attrs'] ?? array();
		$name = $block['blockName'] ?? '';
		$settings = Settings::get();
		$html = Block_Tools::apply_visibility( $html, $block, $settings );
		if ( '' === $html ) return '';
		if ( ! class_exists( 'WP_HTML_Tag_Processor' ) ) return $html;
		$parallax = Parallax::block( $name );
		if ( $parallax && self::boolean( $a['cniParallaxEnabled'] ?? false, false ) ) {
			$p = new \WP_HTML_Tag_Processor( $html );
			if ( $p->next_tag() ) {
				$strength = sanitize_key( $a['cniParallaxStrength'] ?? 'standard' );
				$direction = sanitize_key( $a['cniParallaxDirection'] ?? 'normal' );
				$p->add_class( 'cni-parallax' );
				$p->set_attribute( 'data-cni-parallax', in_array( $strength, array( 'subtle', 'standard', 'strong' ), true ) ? $strength : 'standard' );
				$p->set_attribute( 'data-cni-parallax-direction', in_array( $direction, array( 'normal', 'reverse' ), true ) ? $direction : 'normal' );
				$p->set_attribute( 'data-cni-parallax-mobile', self::boolean( $a['cniParallaxMobile'] ?? false, false ) ? 'true' : 'false' );
				$p->set_attribute( 'data-cni-parallax-selector', $parallax['selector'] );
				if ( ! empty( $parallax['container'] ) ) $p->set_attribute( 'data-cni-parallax-container', $parallax['container'] );
				$html = $p->get_updated_html();
			}
		}
		if ( empty( $a['cniMotionEnabled'] ) || ! self::supports( $name ) ) return Block_Tools::apply_custom_css( $html, $block, $settings );
		$mode = sanitize_key( $a['cniMotionMode'] ?? 'block' );
		if ( in_array( $mode, array( 'character', 'marquee' ), true ) ) {
			if ( ! Text_Motion_Registry::supports_block( $name ) ) return Block_Tools::apply_custom_css( $html, $block, $settings );
			$p = new \WP_HTML_Tag_Processor( $html );
			if ( ! $p->next_tag() ) return Block_Tools::apply_custom_css( $html, $block, $settings );
			$p->add_class( 'cni-text-motion' );
			$p->set_attribute( 'data-cni-text-mode', $mode );
			$p->set_attribute( 'data-cni-mobile', ! empty( $a['cniMotionMobile'] ) ? 'true' : 'false' );
			if ( 'character' === $mode ) {
				$effect_slug = sanitize_key( $a['cniMotionTextEffect'] ?? 'character-fade-up' );
				$effect = Text_Motion_Registry::effect( $effect_slug ) ?? Text_Motion_Registry::effect( 'character-fade-up' );
				$trigger = sanitize_key( $a['cniMotionTrigger'] ?? 'auto' );
				if ( ! in_array( $trigger, $effect['triggers'], true ) ) $trigger = 'auto';
				$p->set_attribute( 'data-cni-text-effect', $effect['slug'] );
				$p->set_attribute( 'data-cni-trigger', $trigger );
				$p->set_attribute( 'data-cni-text-duration', (string) self::number( $a['cniMotionTextDuration'] ?? $effect['defaultDuration'], 40, 5000, $effect['defaultDuration'] ) );
				$p->set_attribute( 'data-cni-text-interval', (string) self::number( $a['cniMotionTextInterval'] ?? 70, 20, 500, 70 ) );
				$p->set_attribute( 'data-cni-delay', (string) self::number( $a['cniMotionDelay'] ?? 0, 0, 10000, 0 ) );
				$p->set_attribute( 'data-cni-offset', (string) self::number( $a['cniMotionTriggerOffset'] ?? 12, 0, 50, 12 ) );
			} else {
				$direction = sanitize_key( $a['cniMotionMarqueeDirection'] ?? 'left' );
				$p->set_attribute( 'data-cni-marquee-direction', in_array( $direction, array( 'left', 'right' ), true ) ? $direction : 'left' );
				$p->set_attribute( 'data-cni-marquee-speed', (string) self::number( $a['cniMotionMarqueeSpeed'] ?? 50, 10, 200, 50 ) );
				$p->set_attribute( 'data-cni-marquee-gap', (string) self::number( $a['cniMotionMarqueeGap'] ?? 48, 0, 300, 48 ) );
				$p->set_attribute( 'data-cni-marquee-fade', ! empty( $a['cniMotionMarqueeFade'] ) ? 'true' : 'false' );
				$p->set_attribute( 'data-cni-marquee-pause-hover', ! empty( $a['cniMotionMarqueePauseHover'] ) ? 'true' : 'false' );
				$p->set_attribute( 'data-cni-marquee-mobile', ! empty( $a['cniMotionMarqueeMobile'] ) ? 'true' : 'false' );
			}
			return Block_Tools::apply_custom_css( $p->get_updated_html(), $block, $settings );
		}
		if ( 'block' !== $mode ) return Block_Tools::apply_custom_css( $html, $block, $settings );

		$effect_slug = sanitize_key( $a['cniMotionEffect'] ?? 'fade' );
		$effect = Effect_Registry::effect( $effect_slug );
		$effect_enabled = $effect && Effect_Registry::supports_effect( $name, $effect_slug );
		$stagger_enabled = ! empty( $a['cniMotionStagger'] ) && Effect_Registry::supports_stagger( $name );
		if ( ! $effect_enabled && ! $stagger_enabled ) return Block_Tools::apply_custom_css( $html, $block, $settings );

		$p = new \WP_HTML_Tag_Processor( $html );
		if ( ! $p->next_tag() ) return Block_Tools::apply_custom_css( $html, $block, $settings );

		if ( $effect_enabled ) {
			$trigger = sanitize_key( $a['cniMotionTrigger'] ?? 'auto' );
			if ( ! in_array( $trigger, $effect['triggers'], true ) ) $trigger = 'auto';
			$speed_mode = sanitize_key( $a['cniMotionSpeedMode'] ?? 'recommended' );
			$speed_presets = array( 'fast' => 400, 'normal' => 600, 'slow' => 800, 'very-slow' => 1200 );
			$duration = 'recommended' === $speed_mode ? $effect['defaultDuration'] : ( $speed_presets[ $speed_mode ] ?? ( $a['cniMotionDuration'] ?? $effect['defaultDuration'] ) );
			$distance_mode = sanitize_key( $a['cniMotionDistanceMode'] ?? 'effect-default' );
			$distance = 'effect-default' === $distance_mode && null !== $effect['defaultDistance'] ? $effect['defaultDistance'] : ( $a['cniMotionDistance'] ?? ( $effect['defaultDistance'] ?? 16 ) );
			$easing = 'recommended' === ( $a['cniMotionEasing'] ?? 'recommended' ) ? $effect['defaultEasing'] : $a['cniMotionEasing'];
			$easing = in_array( $easing, array( 'ease-out', 'ease-in-out', 'ease', 'linear' ), true ) ? $easing : $effect['defaultEasing'];
			$once = 'entrance' === $effect['category'] ? self::boolean( $a['cniMotionOnce'] ?? true, true ) : true;

			$p->add_class( 'cni-motion' );
			$p->add_class( 'cni-motion--pending' );
			$p->set_attribute( 'data-cni-motion', $effect_slug );
			$p->set_attribute( 'data-cni-category', $effect['category'] );
			$p->set_attribute( 'data-cni-trigger', $trigger );
			$p->set_attribute( 'data-cni-duration', (string) self::number( $duration, 100, 5000, $effect['defaultDuration'] ) );
			$p->set_attribute( 'data-cni-delay', (string) self::number( $a['cniMotionDelay'] ?? 0, 0, 10000, 0 ) );
			$p->set_attribute( 'data-cni-easing', $easing );
			$p->set_attribute( 'data-cni-distance', (string) self::number( $distance, 0, 200, $effect['defaultDistance'] ?? 16 ) );
			$p->set_attribute( 'data-cni-offset', (string) self::number( $a['cniMotionTriggerOffset'] ?? 12, 0, 50, 12 ) );
			$p->set_attribute( 'data-cni-once', $once ? 'true' : 'false' );
			$p->set_attribute( 'data-cni-mobile', ! empty( $a['cniMotionMobile'] ) ? 'true' : 'false' );
			$p->set_attribute( 'data-cni-mobile-delay', ! empty( $a['cniMotionMobileDelay'] ) ? 'true' : 'false' );
			$p->set_attribute( 'data-cni-mask-color', sanitize_hex_color( $a['cniMotionMaskColor'] ?? '' ) ?: '#ffffff' );
			$intensity = sanitize_key( $a['cniMotionIntensity'] ?? 'standard' );
			$intensity_type = $effect['supports']['intensity'] ?? false;
			if ( 'zoom' === $intensity_type ) {
				$intensity = in_array( $intensity, array( 'standard', 'strong', 'dynamic' ), true ) ? $intensity : 'standard';
			} elseif ( 'blur-zoom' === $intensity_type ) {
				$intensity = in_array( $intensity, array( 'standard', 'strong' ), true ) ? $intensity : 'standard';
			} else {
				$intensity = 'standard';
			}
			$p->set_attribute( 'data-cni-intensity', $intensity );
		}

		if ( $stagger_enabled ) {
			$stagger_slug = sanitize_key( $a['cniMotionStaggerEffect'] ?? 'fade-up' );
			$stagger_effect = Effect_Registry::effect( $stagger_slug );
			if ( ! $stagger_effect || 'entrance' !== $stagger_effect['category'] ) $stagger_slug = 'fade-up';
			$p->set_attribute( 'data-cni-stagger', $stagger_slug );
			$p->set_attribute( 'data-cni-stagger-interval', (string) self::number( $a['cniMotionStaggerInterval'] ?? 150, 0, 2000, 150 ) );
			$p->set_attribute( 'data-cni-stagger-mobile', ! empty( $a['cniMotionMobileDelay'] ) ? 'true' : 'false' );
		}

		return Block_Tools::apply_custom_css( $p->get_updated_html(), $block, $settings );
	}
}
