<?php
namespace CNI\Motion;
defined( 'ABSPATH' ) || exit;
final class CNI_Blocks_Integration {
	public static function init(): void {
		// This function and its init hook are declared by the current CNI Blocks plugin.
		if ( ! function_exists( 'cni_blocks_register_blocks' ) || false === has_action( 'init', 'cni_blocks_register_blocks' ) ) return;
		add_filter( 'cni_motion_block_matrix', array( __CLASS__, 'block_matrix' ) );
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
