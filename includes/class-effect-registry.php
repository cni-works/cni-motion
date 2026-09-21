<?php
namespace CNI\Motion;

defined( 'ABSPATH' ) || exit;

final class Effect_Registry {
	private const ENTRANCE_TRIGGERS = array( 'auto', 'site-ready', 'scroll', 'immediate' );
	private const EMPHASIS_TRIGGERS = array( 'auto', 'site-ready', 'scroll', 'hover', 'immediate' );

	public static function effects(): array {
		$definitions = array(
			array( 'fade', __( 'フェードイン', 'cni-motion' ), 'entrance', 800, null, null, 'ease-in-out' ),
			array( 'fade-up', __( 'フェードアップ', 'cni-motion' ), 'entrance', 600, 16 ),
			array( 'fade-down', __( 'フェードダウン', 'cni-motion' ), 'entrance', 600, 16 ),
			array( 'fade-left', __( 'フェード（右から）', 'cni-motion' ), 'entrance', 600, 16 ),
			array( 'fade-right', __( 'フェード（左から）', 'cni-motion' ), 'entrance', 600, 16 ),
			array( 'slide-up', __( 'スライドアップ', 'cni-motion' ), 'entrance', 600, 32 ),
			array( 'slide-down', __( 'スライドダウン', 'cni-motion' ), 'entrance', 600, 32 ),
			array( 'slide-left', __( 'スライド（右から）', 'cni-motion' ), 'entrance', 600, 32 ),
			array( 'slide-right', __( 'スライド（左から）', 'cni-motion' ), 'entrance', 600, 32 ),
			array( 'zoom-in', __( 'ズームイン', 'cni-motion' ), 'entrance', 700, null, array( 'intensity' => 'zoom' ) ),
			array( 'zoom-out', __( 'ズームアウト', 'cni-motion' ), 'entrance', 600 ),
			array( 'blur', __( 'ブラー', 'cni-motion' ), 'entrance', 800, null, array( 'blur' => true ) ),
			array( 'blur-zoom-in', __( 'ブラーズームイン', 'cni-motion' ), 'entrance', 800, null, array( 'blur' => true ) ),
			array( 'blur-zoom-out', __( 'ブラーズームアウト', 'cni-motion' ), 'entrance', 800, null, array( 'blur' => true, 'intensity' => 'blur-zoom' ) ),
			array( 'bounce-in', __( 'バウンスイン', 'cni-motion' ), 'entrance', 800 ),
			array( 'bounce-in-up', __( 'バウンスイン Up', 'cni-motion' ), 'entrance', 800, 36 ),
			array( 'bounce-in-down', __( 'バウンスイン Down', 'cni-motion' ), 'entrance', 800, 36 ),
			array( 'bounce-in-left', __( 'バウンスイン Left', 'cni-motion' ), 'entrance', 800, 36 ),
			array( 'bounce-in-right', __( 'バウンスイン Right', 'cni-motion' ), 'entrance', 800, 36 ),
			array( 'flip-in-x', __( 'フリップイン X', 'cni-motion' ), 'entrance', 800 ),
			array( 'flip-in-y', __( 'フリップイン Y', 'cni-motion' ), 'entrance', 800 ),
			array( 'clip-reveal-left', __( 'クリップ：左から表示', 'cni-motion' ), 'reveal', 800 ),
			array( 'clip-reveal-right', __( 'クリップ：右から表示', 'cni-motion' ), 'reveal', 800 ),
			array( 'clip-reveal-up', __( 'クリップ：上から表示', 'cni-motion' ), 'reveal', 800 ),
			array( 'clip-reveal-down', __( 'クリップ：下から表示', 'cni-motion' ), 'reveal', 800 ),
			array( 'mask-reveal-left', __( 'マスク：左から右', 'cni-motion' ), 'reveal', 800, null, array( 'maskColor' => true ) ),
			array( 'mask-reveal-right', __( 'マスク：右から左', 'cni-motion' ), 'reveal', 800, null, array( 'maskColor' => true ) ),
			array( 'mask-reveal-up', __( 'マスク：下から上', 'cni-motion' ), 'reveal', 800, null, array( 'maskColor' => true ) ),
			array( 'mask-reveal-down', __( 'マスク：上から下', 'cni-motion' ), 'reveal', 800, null, array( 'maskColor' => true ) ),
			array( 'bounce', __( 'バウンス', 'cni-motion' ), 'emphasis', 900 ),
			array( 'pulse', __( 'パルス', 'cni-motion' ), 'emphasis', 700 ),
			array( 'swing', __( 'スイング', 'cni-motion' ), 'emphasis', 800 ),
			array( 'tada', __( 'Tada', 'cni-motion' ), 'emphasis', 1000, null, null, 'ease-in-out' ),
			array( 'jello', __( 'Jello', 'cni-motion' ), 'emphasis', 1100 ),
			array( 'rubber-band', __( 'ラバーバンド', 'cni-motion' ), 'emphasis', 950 ),
			array( 'wobble', __( 'Wobble', 'cni-motion' ), 'emphasis', 1000, null, null, 'ease-in-out' ),
			array( 'shake-x', __( 'Shake X', 'cni-motion' ), 'emphasis', 600 ),
			array( 'shake-y', __( 'Shake Y', 'cni-motion' ), 'emphasis', 600 ),
		);

		return array_map(
			static function ( array $definition ): array {
				$category = $definition[2];
				$distance = $definition[4] ?? null;
				$supports = array_merge(
					array( 'distance' => null !== $distance, 'blur' => false, 'maskColor' => false, 'intensity' => false ),
					$definition[5] ?? array()
				);
				return array(
					'slug' => $definition[0],
					'label' => $definition[1],
					'category' => $category,
					'defaultDuration' => $definition[3],
					'defaultEasing' => $definition[6] ?? 'ease-out',
					'defaultDistance' => $distance,
					'supports' => $supports,
					'triggers' => 'emphasis' === $category ? self::EMPHASIS_TRIGGERS : self::ENTRANCE_TRIGGERS,
					'reducedMotionFallback' => 'emphasis' === $category ? 'none' : 'fade',
				);
			},
			$definitions
		);
	}

	public static function effect( string $slug ): ?array {
		foreach ( self::effects() as $effect ) {
			if ( $slug === $effect['slug'] ) return $effect;
		}
		return null;
	}

	public static function block_matrix(): array {
		$standard = array( 'entrance' => true, 'emphasis' => true, 'clip' => true, 'mask' => false, 'stagger' => false );
		$media = array( 'entrance' => true, 'emphasis' => true, 'clip' => true, 'mask' => true, 'stagger' => false );
		$matrix = array(
			'core/paragraph' => $standard,
			'core/heading' => $standard,
			'core/image' => $media,
			'core/group' => array( 'entrance' => true, 'emphasis' => true, 'clip' => true, 'mask' => true, 'stagger' => true ),
			'core/cover' => $media,
			'core/columns' => array( 'entrance' => true, 'emphasis' => false, 'clip' => false, 'mask' => false, 'stagger' => true ),
			'core/column' => $standard,
			'core/buttons' => $standard,
			'core/button' => $standard,
			'core/media-text' => $media,
			'core/list' => $standard,
			'core/list-item' => $standard,
		);
		return apply_filters( 'cni_motion_block_matrix', $matrix );
	}

	public static function supports_block( string $name ): bool {
		return isset( self::block_matrix()[ $name ] );
	}

	public static function supports_stagger( string $name ): bool {
		return ! empty( self::block_matrix()[ $name ]['stagger'] );
	}

	public static function supports_effect( string $name, string $slug ): bool {
		$effect = self::effect( $slug );
		$block = self::block_matrix()[ $name ] ?? null;
		if ( ! $effect || ! $block ) return false;
		if ( 'reveal' === $effect['category'] ) return ! empty( $block[ ! empty( $effect['supports']['maskColor'] ) ? 'mask' : 'clip' ] );
		return ! empty( $block[ $effect['category'] ] );
	}

	/**
	 * Non-block elements can opt into a named, Motion-owned capability profile.
	 * This keeps integrations from treating a private wrapper as a Gutenberg block
	 * or duplicating the effect allow-list in another plugin.
	 */
	public static function element_target( string $target ): ?array {
		$targets = array(
			'free-image' => array( 'entrance' => true, 'emphasis' => true, 'clip' => true, 'mask' => true ),
		);
		$targets = apply_filters( 'cni_motion_element_targets', $targets );
		return $targets[ $target ] ?? null;
	}

	public static function supports_element_effect( string $target, string $slug ): bool {
		$effect = self::effect( $slug );
		$support = self::element_target( $target );
		if ( ! $effect || ! $support ) return false;
		if ( 'reveal' === $effect['category'] ) return ! empty( $support[ ! empty( $effect['supports']['maskColor'] ) ? 'mask' : 'clip' ] );
		return ! empty( $support[ $effect['category'] ] );
	}

	public static function client_data(): array {
		return array(
			'effects'         => self::effects(),
			'blockMatrix'     => self::block_matrix(),
			'elementTargets'  => array( 'free-image' => self::element_target( 'free-image' ) ),
		);
	}
}
