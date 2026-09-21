<?php
namespace CNI\Motion;
defined( 'ABSPATH' ) || exit;
final class CNI_Blocks_Integration {
	public static function init(): void {
		// This function and its init hook are declared by the current CNI Blocks plugin.
		if ( ! function_exists( 'cni_blocks_register_blocks' ) || false === has_action( 'init', 'cni_blocks_register_blocks' ) ) return;
		add_filter( 'cni_motion_block_matrix', array( __CLASS__, 'block_matrix' ) );
		add_filter( 'cni_motion_text_blocks', array( __CLASS__, 'text_blocks' ) );
		add_filter( 'cni_motion_text_accent_blocks', array( __CLASS__, 'text_accent_blocks' ) );
		add_filter( 'cni_motion_parallax_blocks', array( __CLASS__, 'parallax_blocks' ) );
		add_filter( 'render_block', array( __CLASS__, 'render_free_image_motion' ), 20, 2 );
	}

	public static function render_free_image_motion( string $html, array $block ): string {
		if ( 'cni-blocks/outer' !== ( $block['blockName'] ?? '' ) || ! class_exists( 'WP_HTML_Tag_Processor' ) ) return $html;
		$settings = Settings::get();
		if ( empty( $settings['general']['enabled'] ) ) return $html;
		$attributes = $block['attrs'] ?? array();
		if ( empty( $attributes['freeImagesEnabled'] ) || ! is_array( $attributes['freeImages'] ?? null ) ) return $html;

		/* Outer+ saves all back images first, then front images. Include inactive
		 * items in this sequence so each existing wrapper remains aligned without
		 * adding identifiers to save() or invalidating older Outer+ blocks. */
		$motions = array();
		$images = array_slice( $attributes['freeImages'], 0, 6 );
		foreach ( array( 'back', 'front' ) as $layer ) {
			foreach ( $images as $image ) {
				if ( ! is_array( $image ) || empty( $image['imageUrl'] ) ) continue;
				if ( ( $image['layer'] ?? 'front' ) !== $layer ) continue;
				$motions[] = ! empty( $image['motion']['enabled'] ) && is_array( $image['motion'] ) ? $image['motion'] : null;
			}
		}
		if ( ! array_filter( $motions ) ) return $html;

		$processor = new \WP_HTML_Tag_Processor( $html );
		$position = 0;
		while ( $processor->next_tag( array( 'class_name' => 'cni-outer__free-image-motion' ) ) ) {
			$motion = $motions[ $position ] ?? null;
			$position++;
			if ( is_array( $motion ) ) Block_Attributes::apply_element_motion( $processor, $motion, 'free-image' );
		}
		return $processor->get_updated_html();
	}

	public static function parallax_blocks( array $blocks ): array {
		$blocks['cni-blocks/overlap-media'] = array(
			'label'     => __( '画像重ねレイアウト+', 'cni-motion' ),
			'selector'  => '.cni-overlap-media__image',
			'container' => '.cni-overlap-media__media',
		);
		return $blocks;
	}

	public static function text_blocks( array $blocks ): array {
		$blocks[] = 'cni-blocks/heading-plus';
		return array_values( array_unique( $blocks ) );
	}

	public static function text_accent_blocks( array $blocks ): array {
		$blocks[] = 'cni-blocks/heading-plus';
		return array_values( array_unique( $blocks ) );
	}

	public static function block_matrix( array $matrix ): array {
		$standard = array( 'entrance' => true, 'emphasis' => true, 'clip' => true, 'mask' => false, 'stagger' => false );
		$media = array( 'entrance' => true, 'emphasis' => true, 'clip' => true, 'mask' => true, 'stagger' => false );

		/* These names are the registered names in the current CNI Blocks block.json
		 * files. Motion is applied to each block's outer wrapper only. */
		foreach ( array(
			'cni-blocks/breadcrumb',
			'cni-blocks/counter-plus',
			'cni-blocks/custom-field',
			'cni-blocks/fixed-display',
			'cni-blocks/grid-card',
			'cni-blocks/heading-plus',
			'cni-blocks/post-list',
			'cni-blocks/selected-post-list',
			'cni-blocks/slide-gallery',
			'cni-blocks/step',
			'cni-blocks/step-item',
			'cni-blocks/tab-item',
			'cni-blocks/table-plus',
			'cni-blocks/tabs',
			'cni-blocks/timeline',
			'cni-blocks/timeline-item',
		) as $block_name ) $matrix[ $block_name ] = $standard;

		foreach ( array(
			'cni-blocks/overlap-media',
			'cni-blocks/visual-embed',
		) as $block_name ) $matrix[ $block_name ] = $media;

		$matrix['cni-blocks/outer'] = array( 'entrance' => true, 'emphasis' => true, 'clip' => true, 'mask' => true, 'stagger' => true );
		$matrix['cni-blocks/auto-grid'] = array( 'entrance' => true, 'emphasis' => false, 'clip' => false, 'mask' => false, 'stagger' => true );
		return $matrix;
	}
}
