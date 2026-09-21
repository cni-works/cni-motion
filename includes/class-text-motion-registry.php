<?php
namespace CNI\Motion;

defined( 'ABSPATH' ) || exit;

final class Text_Motion_Registry {
	private const TRIGGERS = array( 'auto', 'site-ready', 'scroll', 'immediate' );

	public static function effects(): array {
		return array(
			array( 'slug' => 'character-fade', 'label' => __( '文字フェード', 'cni-motion' ), 'defaultDuration' => 600, 'defaultEasing' => 'ease-out', 'triggers' => self::TRIGGERS ),
			array( 'slug' => 'character-fade-up', 'label' => __( '文字フェードアップ', 'cni-motion' ), 'defaultDuration' => 600, 'defaultEasing' => 'ease-out', 'triggers' => self::TRIGGERS ),
			array( 'slug' => 'character-blur', 'label' => __( '文字ブラー', 'cni-motion' ), 'defaultDuration' => 700, 'defaultEasing' => 'ease-out', 'triggers' => self::TRIGGERS ),
			array( 'slug' => 'character-bounce', 'label' => __( '文字バウンス', 'cni-motion' ), 'defaultDuration' => 700, 'defaultEasing' => 'ease-out', 'triggers' => self::TRIGGERS ),
			array( 'slug' => 'typewriter', 'label' => __( 'タイプライター', 'cni-motion' ), 'defaultDuration' => 80, 'defaultEasing' => 'linear', 'triggers' => self::TRIGGERS ),
		);
	}

	public static function effect( string $slug ): ?array {
		foreach ( self::effects() as $effect ) if ( $slug === $effect['slug'] ) return $effect;
		return null;
	}

	public static function accents(): array {
		return array(
			array( 'slug' => 'marker', 'label' => __( '単色マーカー', 'cni-motion' ), 'defaultDuration' => 700, 'defaultThickness' => 42, 'triggers' => self::TRIGGERS ),
			array( 'slug' => 'gradient-marker', 'label' => __( 'グラデーションマーカー', 'cni-motion' ), 'defaultDuration' => 700, 'defaultThickness' => 42, 'triggers' => self::TRIGGERS ),
			array( 'slug' => 'underline', 'label' => __( '下線ドロー', 'cni-motion' ), 'defaultDuration' => 700, 'defaultThickness' => 10, 'triggers' => self::TRIGGERS ),
			array( 'slug' => 'brush', 'label' => __( 'ブラシマーカー', 'cni-motion' ), 'defaultDuration' => 700, 'defaultThickness' => 48, 'triggers' => self::TRIGGERS ),
		);
	}

	public static function supports_block( string $name ): bool {
		return in_array( $name, apply_filters( 'cni_motion_text_blocks', array( 'core/heading', 'core/paragraph' ) ), true );
	}

	public static function client_data(): array {
		return array(
			'effects'      => self::effects(),
			'blocks'       => apply_filters( 'cni_motion_text_blocks', array( 'core/heading', 'core/paragraph' ) ),
			'accents'      => self::accents(),
			'accentBlocks' => apply_filters( 'cni_motion_text_accent_blocks', array( 'core/heading', 'core/paragraph', 'core/list-item' ) ),
		);
	}
}
