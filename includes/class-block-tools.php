<?php
namespace CNI\Motion;

defined( 'ABSPATH' ) || exit;

final class Block_Tools {
	private static array $rendered_css_ids = array();

	private const EXCLUDED_CORE_BLOCKS = array(
		'core/block',
		'core/freeform',
		'core/html',
		'core/legacy-widget',
		'core/navigation',
		'core/post-template',
		'core/query',
		'core/shortcode',
		'core/template-part',
		'core/widget-group',
	);

	public static function supports_custom_css( string $name ): bool {
		return self::supports_namespace( $name, 'cni_motion_custom_css_support' );
	}

	public static function supports_visibility( string $name ): bool {
		return self::supports_namespace( $name, 'cni_motion_visibility_support' );
	}

	private static function supports_namespace( string $name, string $filter ): bool {
		$supported = ( str_starts_with( $name, 'core/' ) && ! in_array( $name, self::EXCLUDED_CORE_BLOCKS, true ) )
			|| str_starts_with( $name, 'cni-blocks/' );
		return (bool) apply_filters( $filter, $supported, $name );
	}

	public static function client_data(): array {
		$custom_css = array();
		$visibility = array();
		if ( class_exists( 'WP_Block_Type_Registry' ) ) {
			foreach ( array_keys( \WP_Block_Type_Registry::get_instance()->get_all_registered() ) as $name ) {
				if ( self::supports_custom_css( $name ) ) $custom_css[ $name ] = true;
				if ( self::supports_visibility( $name ) ) $visibility[ $name ] = true;
			}
		}
		return array( 'customCss' => $custom_css, 'visibility' => $visibility );
	}

	public static function apply_visibility( string $html, array $block, array $settings ): string {
		if ( empty( $settings['modules']['visibility'] ) || is_admin() ) return $html;
		if ( function_exists( 'wp_is_json_request' ) && wp_is_json_request() ) return $html;
		$name = $block['blockName'] ?? '';
		if ( ! self::supports_visibility( $name ) ) return $html;
		$value = sanitize_key( $block['attrs']['cniVisibility'] ?? 'all' );
		if ( ! in_array( $value, array( 'all', 'logged-in', 'logged-out' ), true ) ) $value = 'all';
		if ( 'logged-in' === $value && ! is_user_logged_in() ) return '';
		if ( 'logged-out' === $value && is_user_logged_in() ) return '';
		return $html;
	}

	public static function apply_custom_css( string $html, array $block, array $settings ): string {
		if ( empty( $settings['modules']['customCss'] ) || is_admin() ) return $html;
		if ( function_exists( 'wp_is_json_request' ) && wp_is_json_request() ) return $html;
		$name = $block['blockName'] ?? '';
		if ( ! self::supports_custom_css( $name ) || ! class_exists( 'WP_HTML_Tag_Processor' ) ) return $html;
		$css = is_string( $block['attrs']['cniCustomCss'] ?? null ) ? trim( $block['attrs']['cniCustomCss'] ) : '';
		$id = is_string( $block['attrs']['cniCssId'] ?? null ) ? strtolower( trim( $block['attrs']['cniCssId'] ) ) : '';
		if ( '' === $css || ! preg_match( '/^cni-block-[a-z0-9]{8,32}$/', $id ) ) return $html;

		self::$rendered_css_ids[ $id ] = ( self::$rendered_css_ids[ $id ] ?? 0 ) + 1;
		$class = 1 === self::$rendered_css_ids[ $id ] ? $id : $id . '-' . self::$rendered_css_ids[ $id ];
		$compiled = self::compile_custom_css( $css, '.' . $class );
		if ( null === $compiled || '' === $compiled ) return $html;

		$processor = new \WP_HTML_Tag_Processor( $html );
		$found = false;
		while ( $processor->next_tag() ) {
			if ( ! in_array( strtoupper( (string) $processor->get_tag() ), array( 'STYLE', 'SCRIPT', 'LINK', 'META' ), true ) ) {
				$found = true;
				break;
			}
		}
		if ( ! $found ) return $html;
		$processor->add_class( $class );
		$style_id = 'cni-custom-css-' . substr( $class, strlen( 'cni-block-' ) );
		return '<style id="' . esc_attr( $style_id ) . '">' . $compiled . '</style>' . $processor->get_updated_html();
	}

	public static function compile_custom_css( string $css, string $scope ): ?string {
		if ( '' === trim( $css ) || strlen( $css ) > 20000 ) return null;
		if ( ! preg_match( '/^\.[a-z][a-z0-9-]{7,48}$/', $scope ) ) return null;
		if ( preg_match( '/<|\x00|@\s*(?:import|font-face|namespace|keyframes)\b|expression\s*\(|javascript\s*:/i', $css ) ) return null;
		$css = self::strip_comments( $css );
		if ( null === $css ) return null;
		return self::compile_rule_list( $css, $scope, true );
	}

	private static function strip_comments( string $css ): ?string {
		$output = '';
		$length = strlen( $css );
		$quote = '';
		for ( $index = 0; $index < $length; $index++ ) {
			$char = $css[ $index ];
			if ( '' !== $quote ) {
				$output .= $char;
				if ( '\\' === $char && $index + 1 < $length ) $output .= $css[ ++$index ];
				elseif ( $char === $quote ) $quote = '';
				continue;
			}
			if ( '"' === $char || "'" === $char ) {
				$quote = $char;
				$output .= $char;
				continue;
			}
			if ( '/' === $char && $index + 1 < $length && '*' === $css[ $index + 1 ] ) {
				$end = strpos( $css, '*/', $index + 2 );
				if ( false === $end ) return null;
				$output .= ' ';
				$index = $end + 1;
				continue;
			}
			$output .= $char;
		}
		return '' === $quote ? $output : null;
	}

	private static function compile_rule_list( string $css, string $scope, bool $allow_media ): ?string {
		$output = '';
		$length = strlen( $css );
		$index = 0;
		while ( $index < $length ) {
			while ( $index < $length && ctype_space( $css[ $index ] ) ) $index++;
			if ( $index >= $length ) break;
			$open = self::find_open_brace( $css, $index );
			if ( false === $open ) return null;
			$prelude = trim( substr( $css, $index, $open - $index ) );
			if ( '' === $prelude ) return null;
			$close = self::find_close_brace( $css, $open );
			if ( false === $close ) return null;
			$body = substr( $css, $open + 1, $close - $open - 1 );
			if ( str_starts_with( strtolower( $prelude ), '@' ) ) {
				if ( ! $allow_media || ! preg_match( '/^@media\s+[a-z0-9\s():.,\/%<>=_-]+$/i', $prelude ) ) return null;
				$nested = self::compile_rule_list( $body, $scope, false );
				if ( null === $nested || '' === $nested ) return null;
				$output .= $prelude . '{' . $nested . '}';
			} else {
				if ( str_contains( $body, '{' ) || str_contains( $body, '}' ) || '' === trim( $body ) ) return null;
				$selectors = self::compile_selectors( $prelude, $scope );
				if ( null === $selectors ) return null;
				$output .= $selectors . '{' . trim( $body ) . '}';
			}
			$index = $close + 1;
		}
		return $output;
	}

	private static function find_open_brace( string $css, int $start ): int|false {
		$quote = '';
		$round = 0;
		$square = 0;
		$length = strlen( $css );
		for ( $index = $start; $index < $length; $index++ ) {
			$char = $css[ $index ];
			if ( '' !== $quote ) {
				if ( '\\' === $char ) $index++;
				elseif ( $char === $quote ) $quote = '';
				continue;
			}
			if ( '"' === $char || "'" === $char ) $quote = $char;
			elseif ( '(' === $char ) $round++;
			elseif ( ')' === $char ) $round--;
			elseif ( '[' === $char ) $square++;
			elseif ( ']' === $char ) $square--;
			elseif ( '}' === $char ) return false;
			elseif ( '{' === $char && 0 === $round && 0 === $square ) return $index;
			if ( $round < 0 || $square < 0 ) return false;
		}
		return false;
	}

	private static function find_close_brace( string $css, int $open ): int|false {
		$depth = 1;
		$quote = '';
		$length = strlen( $css );
		for ( $index = $open + 1; $index < $length; $index++ ) {
			$char = $css[ $index ];
			if ( '' !== $quote ) {
				if ( '\\' === $char ) $index++;
				elseif ( $char === $quote ) $quote = '';
				continue;
			}
			if ( '"' === $char || "'" === $char ) $quote = $char;
			elseif ( '{' === $char ) $depth++;
			elseif ( '}' === $char && 0 === --$depth ) return $index;
		}
		return false;
	}

	private static function compile_selectors( string $selectors, string $scope ): ?string {
		$parts = self::split_selectors( $selectors );
		if ( null === $parts || array() === $parts ) return null;
		$compiled = array();
		foreach ( $parts as $selector ) {
			$selector = trim( $selector );
			if ( ! preg_match( '/^selector(?=$|[\s>.#:\[])/i', $selector ) ) return null;
			$remainder = ltrim( substr( $selector, strlen( 'selector' ) ) );
			if ( self::contains_sibling_combinator( $remainder ) ) return null;
			if ( preg_match( '/\bselector\b/i', $remainder ) ) return null;
			$compiled[] = $scope . $remainder;
		}
		return implode( ',', $compiled );
	}

	private static function contains_sibling_combinator( string $selector ): bool {
		$quote = '';
		$round = 0;
		$square = 0;
		$length = strlen( $selector );
		for ( $index = 0; $index < $length; $index++ ) {
			$char = $selector[ $index ];
			if ( '' !== $quote ) {
				if ( '\\' === $char ) $index++;
				elseif ( $char === $quote ) $quote = '';
				continue;
			}
			if ( '"' === $char || "'" === $char ) $quote = $char;
			elseif ( '(' === $char ) $round++;
			elseif ( ')' === $char ) $round--;
			elseif ( '[' === $char ) $square++;
			elseif ( ']' === $char ) $square--;
			elseif ( 0 === $round && 0 === $square && in_array( $char, array( '+', '~' ), true ) ) return true;
		}
		return false;
	}

	private static function split_selectors( string $selectors ): ?array {
		$parts = array();
		$start = 0;
		$quote = '';
		$round = 0;
		$square = 0;
		$length = strlen( $selectors );
		for ( $index = 0; $index < $length; $index++ ) {
			$char = $selectors[ $index ];
			if ( '' !== $quote ) {
				if ( '\\' === $char ) $index++;
				elseif ( $char === $quote ) $quote = '';
				continue;
			}
			if ( '"' === $char || "'" === $char ) $quote = $char;
			elseif ( '(' === $char ) $round++;
			elseif ( ')' === $char ) $round--;
			elseif ( '[' === $char ) $square++;
			elseif ( ']' === $char ) $square--;
			elseif ( ',' === $char && 0 === $round && 0 === $square ) {
				$parts[] = substr( $selectors, $start, $index - $start );
				$start = $index + 1;
			}
			if ( $round < 0 || $square < 0 ) return null;
		}
		if ( '' !== $quote || 0 !== $round || 0 !== $square ) return null;
		$parts[] = substr( $selectors, $start );
		return $parts;
	}
}
