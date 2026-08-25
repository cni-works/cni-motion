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
		$matrix['cni-blocks/outer'] = array( 'entrance' => true, 'emphasis' => true, 'clip' => true, 'mask' => true, 'stagger' => true );
		$matrix['cni-blocks/auto-grid'] = array( 'entrance' => true, 'emphasis' => false, 'clip' => false, 'mask' => false, 'stagger' => true );
		$matrix['cni-blocks/grid-card'] = array( 'entrance' => true, 'emphasis' => true, 'clip' => true, 'mask' => false, 'stagger' => false );
		return $matrix;
	}
}
