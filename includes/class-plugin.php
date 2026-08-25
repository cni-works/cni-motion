<?php
namespace CNI\Motion;

defined( 'ABSPATH' ) || exit;

require_once CNI_MOTION_DIR . 'includes/class-settings.php';
require_once CNI_MOTION_DIR . 'includes/class-effect-registry.php';
require_once CNI_MOTION_DIR . 'includes/class-block-attributes.php';
require_once CNI_MOTION_DIR . 'includes/class-assets.php';
require_once CNI_MOTION_DIR . 'includes/class-loader.php';
require_once CNI_MOTION_DIR . 'integrations/cni-blocks.php';

final class Plugin {
	private static ?Plugin $instance = null;

	public static function instance(): Plugin {
		return self::$instance ??= new self();
	}

	private function __construct() {
		add_action( 'init', array( __CLASS__, 'load_textdomain' ), 1 );
		add_filter( 'plugin_action_links_' . plugin_basename( CNI_MOTION_FILE ), array( __CLASS__, 'action_links' ) );
		Settings::init();
		Block_Attributes::init();
		Assets::init();
		Loader::init();
		CNI_Blocks_Integration::init();
	}

	public static function load_textdomain(): void {
		load_plugin_textdomain( 'cni-motion', false, dirname( plugin_basename( CNI_MOTION_FILE ) ) . '/languages' );
	}

	public static function action_links( array $links ): array {
		if ( ! current_user_can( 'manage_options' ) ) return $links;
		$settings = sprintf(
			'<a href="%s">%s</a>',
			esc_url( admin_url( 'options-general.php?page=cni-motion' ) ),
			esc_html__( '設定', 'cni-motion' )
		);
		array_unshift( $links, $settings );
		return $links;
	}
}
