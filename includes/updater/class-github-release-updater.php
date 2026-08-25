<?php
/**
 * GitHub Release updater for CNI Motion.
 *
 * @package CniMotion
 */

namespace CNI\Motion\Updater;

if ( ! defined( 'ABSPATH' ) ) {
	return;
}

/**
 * Integrates the public CNI Motion GitHub Release with WordPress updates.
 */
final class GitHub_Release_Updater {
	const API_VERSION = '2022-11-28';

	/** @var array<string, mixed> */
	private $config = array();

	/** @var string */
	private $cache_key = '';

	/** @var bool */
	private $result_loaded = false;

	/** @var array{state:string,release?:array<string,string>} */
	private $result = array( 'state' => 'failure' );

	/**
	 * Registers the updater only when its configuration matches this plugin.
	 *
	 * @param array<string, mixed> $config Updater configuration.
	 */
	public function __construct( array $config ) {
		$this->config = wp_parse_args(
			$config,
			array(
				'owner'         => '',
				'repository'    => '',
				'slug'          => '',
				'plugin_file'   => '',
				'version'       => '',
				'update_uri'    => '',
				'requires'      => '6.7',
				'requires_php'  => '8.0',
				'cache_hours'   => 12,
				'failure_hours' => 1,
				'timeout'       => 5,
			)
		);

		if ( ! $this->has_valid_configuration() ) {
			return;
		}

		$this->cache_key = 'cni_motion_gh_release_' . md5(
			strtolower( $this->config['owner'] . '/' . $this->config['repository'] )
		);

		add_action(
			'load-update-core.php',
			array( $this, 'maybe_clear_cache_for_forced_check' ),
			5
		);

		$hostname = wp_parse_url( $this->config['update_uri'], PHP_URL_HOST );
		add_filter(
			'update_plugins_' . $hostname,
			array( $this, 'filter_plugin_update' ),
			10,
			4
		);
	}

	/**
	 * Supplies update data for CNI Motion only.
	 *
	 * @param array|false          $update      Existing update data.
	 * @param array<string, mixed> $plugin_data Plugin headers.
	 * @param string               $plugin_file Plugin basename.
	 * @param string[]             $locales     Requested locales.
	 * @return array|false
	 */
	public function filter_plugin_update( $update, $plugin_data, $plugin_file, $locales ) { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.FoundAfterLastUsed
		if ( false !== $update || $plugin_file !== $this->config['plugin_file'] ) {
			return $update;
		}

		if ( ! $this->matches_update_uri( $plugin_data ) ) {
			return $update;
		}

		$result = $this->get_release_result();
		if ( 'success' !== $result['state'] || empty( $result['release'] ) ) {
			return $update;
		}

		$release = $result['release'];
		if ( ! version_compare( $release['version'], $this->config['version'], '>' ) ) {
			return $this->make_no_update_data();
		}

		return $this->make_update_data( $release );
	}

	/**
	 * Clears only the CNI Motion repository cache on WordPress's forced check.
	 */
	public function maybe_clear_cache_for_forced_check() {
		if ( ! is_admin() || ! function_exists( 'current_user_can' ) ) {
			return;
		}

		$force_check = isset( $_GET['force-check'] ) && is_string( $_GET['force-check'] ) // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			? sanitize_text_field( wp_unslash( $_GET['force-check'] ) ) // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			: '';

		if ( '1' === $force_check && current_user_can( 'update_plugins' ) ) {
			delete_site_transient( $this->cache_key );
		}
	}

	/**
	 * Validates configuration without affecting the plugin when installed under
	 * a development folder name that differs from the formal release slug.
	 *
	 * @return bool
	 */
	private function has_valid_configuration() {
		foreach ( array( 'owner', 'repository', 'slug' ) as $key ) {
			if ( ! is_string( $this->config[ $key ] ) || ! preg_match( '/^[A-Za-z0-9._-]+$/', $this->config[ $key ] ) ) {
				return false;
			}
		}

		if (
			! is_string( $this->config['plugin_file'] ) ||
			! $this->is_semantic_version( $this->config['version'] ) ||
			! is_string( $this->config['update_uri'] )
		) {
			return false;
		}

		$expected_update_uri = sprintf(
			'https://github.com/%s/%s',
			$this->config['owner'],
			$this->config['repository']
		);

		return untrailingslashit( $this->config['update_uri'] ) === $expected_update_uri &&
			dirname( $this->config['plugin_file'] ) === $this->config['slug'];
	}

	/**
	 * Gets a validated release result using positive and negative caches.
	 *
	 * @return array{state:string,release?:array<string,string>}
	 */
	private function get_release_result() {
		if ( $this->result_loaded ) {
			return $this->result;
		}

		$this->result_loaded = true;
		$cached              = get_site_transient( $this->cache_key );

		if ( is_array( $cached ) && isset( $cached['state'] ) ) {
			if ( 'success' === $cached['state'] && isset( $cached['release'] ) && is_array( $cached['release'] ) ) {
				$this->result = array(
					'state'   => 'success',
					'release' => $cached['release'],
				);
			} elseif ( 'failure' === $cached['state'] ) {
				$this->result = array( 'state' => 'failure' );
			} else {
				$cached = false;
			}

			if ( false !== $cached ) {
				return $this->result;
			}
		}

		$release = $this->request_release();
		if ( null === $release ) {
			$this->result = array( 'state' => 'failure' );
			set_site_transient(
				$this->cache_key,
				$this->result,
				$this->hours_to_seconds( $this->config['failure_hours'], 1 )
			);

			return $this->result;
		}

		$this->result = array(
			'state'   => 'success',
			'release' => $release,
		);
		set_site_transient(
			$this->cache_key,
			$this->result,
			$this->hours_to_seconds( $this->config['cache_hours'], 12 )
		);

		return $this->result;
	}

	/**
	 * Fetches and validates GitHub's latest published release.
	 *
	 * @return array<string, string>|null
	 */
	private function request_release() {
		$endpoint = sprintf(
			'https://api.github.com/repos/%s/%s/releases/latest',
			rawurlencode( $this->config['owner'] ),
			rawurlencode( $this->config['repository'] )
		);

		$response = wp_safe_remote_get(
			$endpoint,
			array(
				'timeout'     => $this->normalized_timeout(),
				'redirection' => 3,
				'headers'     => array(
					'Accept'               => 'application/vnd.github+json',
					'X-GitHub-Api-Version' => self::API_VERSION,
					'User-Agent'           => 'CNI-Motion-WordPress-Updater/1.0',
				),
			)
		);

		if ( is_wp_error( $response ) || 200 !== (int) wp_remote_retrieve_response_code( $response ) ) {
			return null;
		}

		$body = json_decode( wp_remote_retrieve_body( $response ), true );
		if ( ! is_array( $body ) || JSON_ERROR_NONE !== json_last_error() ) {
			return null;
		}

		if (
			! empty( $body['draft'] ) ||
			! empty( $body['prerelease'] ) ||
			! isset( $body['tag_name'] ) ||
			! is_string( $body['tag_name'] )
		) {
			return null;
		}

		$tag_match = array();
		if ( ! preg_match( '/^v(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/', $body['tag_name'], $tag_match ) ) {
			return null;
		}

		$release_version   = $tag_match[1] . '.' . $tag_match[2] . '.' . $tag_match[3];
		$expected_filename = $this->config['slug'] . '-' . $release_version . '.zip';
		$matching_assets   = array();

		if ( empty( $body['assets'] ) || ! is_array( $body['assets'] ) ) {
			return null;
		}

		foreach ( $body['assets'] as $asset ) {
			if (
				is_array( $asset ) &&
				isset( $asset['name'], $asset['state'], $asset['browser_download_url'] ) &&
				$expected_filename === $asset['name'] &&
				'uploaded' === $asset['state'] &&
				$this->is_valid_release_asset_url( $asset['browser_download_url'] )
			) {
				$matching_assets[] = $asset;
			}
		}

		if ( 1 !== count( $matching_assets ) ) {
			return null;
		}

		$release_url = isset( $body['html_url'] ) && $this->is_valid_github_url( $body['html_url'] )
			? $body['html_url']
			: $this->config['update_uri'];

		return array(
			'version' => $release_version,
			'package' => $matching_assets[0]['browser_download_url'],
			'url'     => $release_url,
		);
	}

	/**
	 * Builds update metadata for WordPress.
	 *
	 * @param array<string, string> $release Validated release.
	 * @return array<string, string>
	 */
	private function make_update_data( $release ) {
		return array(
			'id'           => $this->config['update_uri'],
			'version'      => $release['version'],
			'new_version'  => $release['version'],
			'url'          => $release['url'],
			'package'      => $release['package'],
			'requires'     => $this->config['requires'],
			'requires_php' => $this->config['requires_php'],
			'slug'         => $this->config['slug'],
		);
	}

	/**
	 * Builds no-update metadata only after a successful GitHub response.
	 *
	 * @return array<string, string>
	 */
	private function make_no_update_data() {
		return array(
			'id'           => $this->config['update_uri'],
			'plugin'       => $this->config['plugin_file'],
			'version'      => $this->config['version'],
			'new_version'  => $this->config['version'],
			'url'          => $this->config['update_uri'],
			'requires'     => $this->config['requires'],
			'requires_php' => $this->config['requires_php'],
			'slug'         => $this->config['slug'],
		);
	}

	/**
	 * Confirms that WordPress is asking about this exact Update URI.
	 *
	 * @param array<string, mixed> $headers Plugin headers.
	 * @return bool
	 */
	private function matches_update_uri( $headers ) {
		return isset( $headers['UpdateURI'] ) &&
			is_string( $headers['UpdateURI'] ) &&
			untrailingslashit( $headers['UpdateURI'] ) === untrailingslashit( $this->config['update_uri'] );
	}

	/**
	 * Validates a GitHub Release Asset download URL for this repository.
	 *
	 * @param mixed $url URL to validate.
	 * @return bool
	 */
	private function is_valid_release_asset_url( $url ) {
		if ( ! $this->is_valid_github_url( $url ) ) {
			return false;
		}

		$expected_prefix = sprintf(
			'/%s/%s/releases/download/',
			$this->config['owner'],
			$this->config['repository']
		);
		$path = (string) wp_parse_url( $url, PHP_URL_PATH );

		return 0 === strpos( $path, $expected_prefix );
	}

	/**
	 * Allows only HTTPS github.com URLs.
	 *
	 * @param mixed $url URL to validate.
	 * @return bool
	 */
	private function is_valid_github_url( $url ) {
		if ( ! is_string( $url ) || ! wp_http_validate_url( $url ) ) {
			return false;
		}

		return 'https' === wp_parse_url( $url, PHP_URL_SCHEME ) &&
			'github.com' === strtolower( (string) wp_parse_url( $url, PHP_URL_HOST ) );
	}

	/**
	 * Validates the supported stable X.Y.Z format.
	 *
	 * @param mixed $version Version to validate.
	 * @return bool
	 */
	private function is_semantic_version( $version ) {
		return is_string( $version ) &&
			1 === preg_match( '/^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/', $version );
	}

	/**
	 * Converts configured cache hours to seconds.
	 *
	 * @param mixed $hours   Configured hours.
	 * @param int   $default Default hours.
	 * @return int
	 */
	private function hours_to_seconds( $hours, $default ) {
		$hours = is_numeric( $hours ) ? (float) $hours : (float) $default;
		if ( $hours <= 0 ) {
			$hours = (float) $default;
		}

		return max( 60, (int) round( $hours * HOUR_IN_SECONDS ) );
	}

	/**
	 * Restricts the HTTP timeout to a safe range.
	 *
	 * @return int
	 */
	private function normalized_timeout() {
		$timeout = is_numeric( $this->config['timeout'] ) ? (int) $this->config['timeout'] : 5;

		return min( 5, max( 3, $timeout ) );
	}
}
