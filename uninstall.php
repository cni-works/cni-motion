<?php
defined( 'WP_UNINSTALL_PLUGIN' ) || exit;
$settings = get_option( 'cni_motion_settings', array() );
if ( ! empty( $settings['general']['deleteOnUninstall'] ) ) {
	delete_option( 'cni_motion_settings' );
}

