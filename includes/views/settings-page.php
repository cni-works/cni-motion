<?php
defined( 'ABSPATH' ) || exit;

$field = static function ( string $key, $fallback = '' ) use ( $s ) {
	$value = $s;
	foreach ( explode( '.', $key ) as $part ) $value = $value[ $part ] ?? $fallback;
	return $value;
};

$speed_options = array(
	'recommended' => __( '推奨', 'cni-motion' ),
	'fast' => __( '速い', 'cni-motion' ),
	'normal' => __( '標準', 'cni-motion' ),
	'slow' => __( 'ゆっくり', 'cni-motion' ),
	'very-slow' => __( 'かなりゆっくり', 'cni-motion' ),
);
$offset_options = array(
	'early' => __( '早め', 'cni-motion' ),
	'normal' => __( '標準', 'cni-motion' ),
	'late' => __( '遅め', 'cni-motion' ),
);
$loader_selects = array(
	'preset' => array(
		'label' => __( 'ローダー演出プリセット', 'cni-motion' ),
		'options' => array( 'classic-split' => __( 'Classic Split', 'cni-motion' ), 'minimal-fade' => __( 'Minimal Fade', 'cni-motion' ), 'brand-wipe' => __( 'Brand Wipe', 'cni-motion' ), 'circle' => __( 'Circle', 'cni-motion' ) ),
	),
	'scope' => array(
		'label' => __( '表示対象', 'cni-motion' ),
		'options' => array( 'front-page' => __( 'トップページのみ', 'cni-motion' ), 'all-pages' => __( '全ページ', 'cni-motion' ) ),
	),
	'frequency' => array(
		'label' => __( '表示頻度', 'cni-motion' ),
		'options' => array( 'always' => __( '毎回', 'cni-motion' ), 'session' => __( 'セッションごとに1回', 'cni-motion' ), 'first-visit' => __( '初回訪問のみ', 'cni-motion' ) ),
	),
	'contentType' => array(
		'label' => __( 'コンテンツ', 'cni-motion' ),
		'options' => array( 'site-logo' => __( 'サイトロゴ', 'cni-motion' ), 'custom-image' => __( 'カスタム画像', 'cni-motion' ), 'site-title' => __( 'サイトタイトル', 'cni-motion' ), 'custom-text' => __( 'カスタムテキスト', 'cni-motion' ), 'line' => __( 'ライン', 'cni-motion' ), 'dots' => __( 'ドット', 'cni-motion' ), 'none' => __( 'なし', 'cni-motion' ) ),
	),
	'contentEnter' => array(
		'label' => __( 'Enter', 'cni-motion' ),
		'options' => array( 'none' => __( 'なし', 'cni-motion' ), 'fade' => __( 'Fade', 'cni-motion' ), 'fade-up' => __( 'Fade Up', 'cni-motion' ), 'zoom-in' => __( 'Zoom In', 'cni-motion' ), 'blur-in' => __( 'Blur In', 'cni-motion' ), 'clip-reveal' => __( 'Clip Reveal', 'cni-motion' ) ),
	),
	'contentExit' => array(
		'label' => __( 'Exit', 'cni-motion' ),
		'options' => array( 'none' => __( 'なし', 'cni-motion' ), 'fade-out' => __( 'Fade Out', 'cni-motion' ), 'zoom-out' => __( 'Zoom Out', 'cni-motion' ), 'blur-out' => __( 'Blur Out', 'cni-motion' ), 'slide-up' => __( 'Slide Up', 'cni-motion' ) ),
	),
	'siteReveal' => array(
		'label' => __( 'サイト表示', 'cni-motion' ),
		'options' => array( 'fade' => __( 'Fade', 'cni-motion' ), 'split-horizontal' => __( 'Split Horizontal', 'cni-motion' ), 'split-vertical' => __( 'Split Vertical', 'cni-motion' ), 'wipe-left' => __( 'Wipe Left', 'cni-motion' ), 'wipe-right' => __( 'Wipe Right', 'cni-motion' ), 'wipe-up' => __( 'Wipe Up', 'cni-motion' ), 'wipe-down' => __( 'Wipe Down', 'cni-motion' ), 'circle-reveal' => __( 'Circle Reveal', 'cni-motion' ) ),
	),
);
$loader_preset_descriptions = array(
	'classic-split' => __( 'ロゴ表示後、左右に開いてサイトを表示します。', 'cni-motion' ),
	'minimal-fade' => __( 'シンプルなFadeを中心にサイトを表示します。', 'cni-motion' ),
	'brand-wipe' => __( 'Blurでロゴを表示し、右方向のWipeでサイトを表示します。', 'cni-motion' ),
	'circle' => __( '中央から円形にサイトを表示します。', 'cni-motion' ),
);
$number_fields = array(
	'holdDuration' => array( __( '保持 (ms)', 'cni-motion' ), 0, 5000, 100 ),
	'contentEnterDuration' => array( __( 'Enter時間 (ms)', 'cni-motion' ), 100, 5000, 100 ),
	'contentExitDuration' => array( __( 'Exit時間 (ms)', 'cni-motion' ), 100, 5000, 100 ),
	'siteRevealDuration' => array( __( 'Reveal時間 (ms)', 'cni-motion' ), 100, 5000, 100 ),
	'maxWait' => array( __( '最大待機 (ms)', 'cni-motion' ), 500, 10000, 100 ),
	'logoDesktopWidth' => array( __( 'ロゴPC幅 (px)', 'cni-motion' ), 50, 800, 10 ),
	'logoMobileWidth' => array( __( 'ロゴSP幅 (px)', 'cni-motion' ), 50, 800, 10 ),
);
?>
<div class="wrap">
	<h1><?php esc_html_e( 'CNI Motion', 'cni-motion' ); ?></h1>
	<form action="options.php" method="post">
		<?php settings_fields( 'cni_motion' ); ?>
		<h2><?php esc_html_e( '基本設定', 'cni-motion' ); ?></h2>
		<table class="form-table">
			<tr><th><?php esc_html_e( 'CNI Motion全体', 'cni-motion' ); ?></th><td><label><input type="checkbox" name="cni_motion_settings[general][enabled]" value="1" <?php checked( $field( 'general.enabled' ) ); ?>> <?php esc_html_e( '有効化', 'cni-motion' ); ?></label></td></tr>
			<tr><th><?php esc_html_e( 'Reduced Motion対応', 'cni-motion' ); ?></th><td><label><input type="checkbox" name="cni_motion_settings[general][reducedMotion]" value="1" <?php checked( $field( 'general.reducedMotion' ) ); ?>> <?php esc_html_e( 'OS設定を尊重する', 'cni-motion' ); ?></label></td></tr>
			<tr><th><?php esc_html_e( 'モバイルの初期値', 'cni-motion' ); ?></th><td><label><input type="checkbox" name="cni_motion_settings[defaults][mobileMotion]" value="1" <?php checked( $field( 'defaults.mobileMotion' ) ); ?>> <?php esc_html_e( 'Motionを有効', 'cni-motion' ); ?></label><br><label><input type="checkbox" name="cni_motion_settings[defaults][mobileDelay]" value="1" <?php checked( $field( 'defaults.mobileDelay' ) ); ?>> <?php esc_html_e( '遅延を有効', 'cni-motion' ); ?></label></td></tr>
			<tr><th><?php esc_html_e( 'モバイルの境界幅', 'cni-motion' ); ?></th><td><input type="number" min="480" max="1200" name="cni_motion_settings[defaults][breakpoint]" value="<?php echo esc_attr( $field( 'defaults.breakpoint' ) ); ?>"> <?php esc_html_e( 'px', 'cni-motion' ); ?></td></tr>
			<tr><th><?php esc_html_e( 'アンインストール', 'cni-motion' ); ?></th><td><label><input type="checkbox" name="cni_motion_settings[general][deleteOnUninstall]" value="1" <?php checked( $field( 'general.deleteOnUninstall' ) ); ?>> <?php esc_html_e( '設定を削除する', 'cni-motion' ); ?></label></td></tr>
		</table>

		<h2><?php esc_html_e( 'Motion Defaults', 'cni-motion' ); ?></h2>
		<table class="form-table">
			<tr><th><?php esc_html_e( '標準速度', 'cni-motion' ); ?></th><td><select name="cni_motion_settings[defaults][speed]"><?php foreach ( $speed_options as $value => $label ) : ?><option value="<?php echo esc_attr( $value ); ?>" <?php selected( $field( 'defaults.speed' ), $value ); ?>><?php echo esc_html( $label ); ?></option><?php endforeach; ?></select></td></tr>
			<tr><th><?php esc_html_e( '標準遅延', 'cni-motion' ); ?></th><td><input type="number" min="0" max="10000" step="100" name="cni_motion_settings[defaults][delay]" value="<?php echo esc_attr( $field( 'defaults.delay' ) ); ?>"> <?php esc_html_e( 'ms', 'cni-motion' ); ?></td></tr>
			<tr><th><?php esc_html_e( '標準表示タイミング', 'cni-motion' ); ?></th><td><select name="cni_motion_settings[defaults][offset]"><?php foreach ( $offset_options as $value => $label ) : ?><option value="<?php echo esc_attr( $value ); ?>" <?php selected( $field( 'defaults.offset' ), $value ); ?>><?php echo esc_html( $label ); ?></option><?php endforeach; ?></select></td></tr>
		</table>

		<h2><?php esc_html_e( 'Page Loader', 'cni-motion' ); ?></h2>
		<table class="form-table">
			<tr><th><?php esc_html_e( 'ローダー', 'cni-motion' ); ?></th><td><label><input type="checkbox" name="cni_motion_settings[loader][enabled]" value="1" <?php checked( $field( 'loader.enabled' ) ); ?>> <?php esc_html_e( '有効化', 'cni-motion' ); ?></label></td></tr>
			<?php foreach ( $loader_selects as $name => $definition ) : ?>
				<tr><th><?php echo esc_html( $definition['label'] ); ?></th><td><select name="cni_motion_settings[loader][<?php echo esc_attr( $name ); ?>]"><?php foreach ( $definition['options'] as $value => $label ) : ?><option value="<?php echo esc_attr( $value ); ?>" <?php selected( $field( 'loader.' . $name ), $value ); ?>><?php echo esc_html( $label ); ?></option><?php endforeach; ?></select>
					<?php if ( 'preset' === $name ) : ?>
						<p class="description"><?php esc_html_e( 'ローダーの表示内容・登場・退場・サイト表示をまとめて設定します。適用後は各項目を個別に変更できます。', 'cni-motion' ); ?></p>
						<ul class="description">
							<?php foreach ( $definition['options'] as $preset_slug => $preset_label ) : ?>
								<li><strong><?php echo esc_html( $preset_label ); ?>：</strong><?php echo esc_html( $loader_preset_descriptions[ $preset_slug ] ); ?></li>
							<?php endforeach; ?>
						</ul>
					<?php endif; ?>
				</td></tr>
			<?php endforeach; ?>
			<?php foreach ( $number_fields as $name => $definition ) : ?>
				<tr><th><?php echo esc_html( $definition[0] ); ?></th><td><input type="number" min="<?php echo esc_attr( $definition[1] ); ?>" max="<?php echo esc_attr( $definition[2] ); ?>" step="<?php echo esc_attr( $definition[3] ); ?>" name="cni_motion_settings[loader][<?php echo esc_attr( $name ); ?>]" value="<?php echo esc_attr( $field( 'loader.' . $name ) ); ?>"></td></tr>
			<?php endforeach; ?>
			<tr><th><?php esc_html_e( 'サイトタイトル詳細', 'cni-motion' ); ?></th><td class="cni-title-settings">
				<label><?php esc_html_e( 'PC文字サイズ', 'cni-motion' ); ?> <input type="number" min="12" max="200" name="cni_motion_settings[loader][siteTitleDesktopFontSize]" value="<?php echo esc_attr( $field( 'loader.siteTitleDesktopFontSize' ) ); ?>"> <?php esc_html_e( 'px', 'cni-motion' ); ?></label><br>
				<label><?php esc_html_e( 'SP文字サイズ', 'cni-motion' ); ?> <input type="number" min="12" max="200" name="cni_motion_settings[loader][siteTitleMobileFontSize]" value="<?php echo esc_attr( $field( 'loader.siteTitleMobileFontSize' ) ); ?>"> <?php esc_html_e( 'px', 'cni-motion' ); ?></label><br>
				<label><?php esc_html_e( '文字ウェイト', 'cni-motion' ); ?> <select name="cni_motion_settings[loader][siteTitleFontWeight]"><?php foreach ( range( 100, 900, 100 ) as $weight ) : ?><option value="<?php echo esc_attr( $weight ); ?>" <?php selected( (int) $field( 'loader.siteTitleFontWeight' ), $weight ); ?>><?php echo esc_html( $weight ); ?></option><?php endforeach; ?></select></label><br>
				<label><?php esc_html_e( '文字間隔', 'cni-motion' ); ?> <input type="number" min="-0.1" max="1" step="0.01" name="cni_motion_settings[loader][siteTitleLetterSpacing]" value="<?php echo esc_attr( $field( 'loader.siteTitleLetterSpacing' ) ); ?>"> <?php esc_html_e( 'em', 'cni-motion' ); ?></label><br>
				<label><?php esc_html_e( '文字色', 'cni-motion' ); ?> <input class="cni-color" type="color" name="cni_motion_settings[loader][siteTitleTextColor]" value="<?php echo esc_attr( $field( 'loader.siteTitleTextColor' ) ); ?>"></label>
			</td></tr>
			<tr><th><?php esc_html_e( 'カスタム画像', 'cni-motion' ); ?></th><td><input id="cni-custom-image-id" type="hidden" name="cni_motion_settings[loader][customImageId]" value="<?php echo esc_attr( $field( 'loader.customImageId' ) ); ?>"><button type="button" class="button" id="cni-select-image"><?php esc_html_e( '画像を選択', 'cni-motion' ); ?></button><?php $preview = wp_get_attachment_image_url( absint( $field( 'loader.customImageId' ) ), 'medium' ); ?><img id="cni-image-preview" src="<?php echo esc_url( $preview ?: '' ); ?>" alt="" <?php echo $preview ? '' : 'style="display:none"'; ?>></td></tr>
			<tr><th><?php esc_html_e( 'カスタムテキスト', 'cni-motion' ); ?></th><td><input class="regular-text" type="text" name="cni_motion_settings[loader][customText]" value="<?php echo esc_attr( $field( 'loader.customText' ) ); ?>"></td></tr>
			<tr><th><?php esc_html_e( '背景色', 'cni-motion' ); ?></th><td><input class="cni-color" type="color" name="cni_motion_settings[loader][backgroundColor]" value="<?php echo esc_attr( $field( 'loader.backgroundColor' ) ); ?>"></td></tr>
			<tr><th><?php esc_html_e( '管理者', 'cni-motion' ); ?></th><td><label><input type="checkbox" name="cni_motion_settings[loader][skipAdmin]" value="1" <?php checked( $field( 'loader.skipAdmin' ) ); ?>> <?php esc_html_e( '表示しない', 'cni-motion' ); ?></label></td></tr>
		</table>

		<h2><?php esc_html_e( 'Advanced', 'cni-motion' ); ?></h2>
		<p class="description"><?php esc_html_e( 'CNI Motion v1.0では、追加のAdvanced設定は定義されていません。', 'cni-motion' ); ?></p>
		<?php submit_button(); ?>
	</form>
	<p><button type="button" class="button button-secondary" id="cni-loader-preview"><?php esc_html_e( 'Loaderをプレビュー', 'cni-motion' ); ?></button> <button type="button" class="button" id="cni-loader-reset"><?php esc_html_e( 'このブラウザの表示履歴をリセット', 'cni-motion' ); ?></button></p>
</div>
