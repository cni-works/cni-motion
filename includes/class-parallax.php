<?php
namespace CNI\Motion;

defined( 'ABSPATH' ) || exit;

final class Parallax {
	public static function blocks(): array {
		$blocks = array(
			'core/cover' => array(
				'label'     => __( 'カバー', 'cni-motion' ),
				'selector'  => '.wp-block-cover__image-background',
				'container' => '',
			),
			'core/media-text' => array(
				'label'     => __( 'メディアとテキスト', 'cni-motion' ),
				'selector'  => '.wp-block-media-text__media img',
				'container' => '.wp-block-media-text__media',
			),
		);

		$blocks = apply_filters( 'cni_motion_parallax_blocks', $blocks );
		return is_array( $blocks ) ? $blocks : array();
	}

	public static function block( string $name ): ?array {
		$blocks = self::blocks();
		$block = $blocks[ $name ] ?? null;
		if ( ! is_array( $block ) || empty( $block['selector'] ) ) return null;
		return $block;
	}

	public static function supports_block( string $name ): bool {
		return null !== self::block( $name );
	}

	public static function client_data(): array {
		return array( 'blocks' => self::blocks() );
	}
}
