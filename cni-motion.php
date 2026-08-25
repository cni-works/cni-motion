<?php
/**
 * Plugin Name: CNI Motion
 * Description: Gutenberg blocks, first-view motion, and a safe page loader managed from one place.
 * Version: 1.0.2
 * Requires at least: 6.7
 * Requires PHP: 8.0
 * Update URI: https://github.com/cni-works/cni-motion
 * Author: Oishi Naoto
 * License: GPLv2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: cni-motion
 */

defined( 'ABSPATH' ) || exit;

define( 'CNI_MOTION_VERSION', '1.0.2' );
define( 'CNI_MOTION_FILE', __FILE__ );
define( 'CNI_MOTION_DIR', plugin_dir_path( __FILE__ ) );
define( 'CNI_MOTION_URL', plugin_dir_url( __FILE__ ) );

$cni_motion_updater_file = CNI_MOTION_DIR . 'includes/updater/class-github-release-updater.php';

if ( is_readable( $cni_motion_updater_file ) ) {
	require_once $cni_motion_updater_file;

	if ( class_exists( 'CNI\\Motion\\Updater\\GitHub_Release_Updater' ) ) {
		$cni_motion_updater_headers = get_file_data(
			__FILE__,
			array(
				'version'    => 'Version',
				'update_uri' => 'Update URI',
			),
			'plugin'
		);

		new \CNI\Motion\Updater\GitHub_Release_Updater(
			array(
				'owner'         => 'cni-works',
				'repository'    => 'cni-motion',
				'slug'          => 'cni-motion',
				'plugin_file'   => plugin_basename( __FILE__ ),
				'version'       => $cni_motion_updater_headers['version'],
				'update_uri'    => $cni_motion_updater_headers['update_uri'],
				'requires'      => '6.7',
				'requires_php'  => '8.0',
				'cache_hours'   => 12,
				'failure_hours' => 1,
				'timeout'       => 5,
			)
		);
	}
}

require_once CNI_MOTION_DIR . 'includes/class-plugin.php';

add_action( 'plugins_loaded', array( 'CNI\\Motion\\Plugin', 'instance' ) );
