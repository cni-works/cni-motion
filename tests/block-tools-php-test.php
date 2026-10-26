<?php
define( 'ABSPATH', __DIR__ );
require dirname( __DIR__ ) . '/includes/class-block-tools.php';

use CNI\Motion\Block_Tools;

function expect_same( $expected, $actual, string $message ): void {
	if ( $expected !== $actual ) {
		fwrite( STDERR, $message . "\nExpected: " . var_export( $expected, true ) . "\nActual: " . var_export( $actual, true ) . "\n" );
		exit( 1 );
	}
}

function expect_null( $actual, string $message ): void {
	expect_same( null, $actual, $message );
}

$scope = '.cni-block-a1b2c3d4';
expect_same( '.cni-block-a1b2c3d4{color:red;}', Block_Tools::compile_custom_css( 'selector { color:red; }', $scope ), 'Basic selector must be scoped.' );
expect_same( '.cni-block-a1b2c3d4:hover,.cni-block-a1b2c3d4 > .child{opacity:.8;}', Block_Tools::compile_custom_css( 'selector:hover, selector > .child { opacity:.8; }', $scope ), 'Pseudo and child selectors must be scoped.' );
expect_same( '.cni-block-a1b2c3d4 img{display:block;}', Block_Tools::compile_custom_css( 'selector img { display:block; }', $scope ), 'Descendant selector whitespace must be preserved.' );
expect_same( '@media (max-width: 767px){.cni-block-a1b2c3d4{padding:20px;}}', Block_Tools::compile_custom_css( '@media (max-width: 767px) { selector { padding:20px; } }', $scope ), 'Media query must preserve scoped rules.' );
expect_same( '.cni-block-a1b2c3d4::before{content:"selector";}', Block_Tools::compile_custom_css( 'selector::before { content:"selector"; }', $scope ), 'Declaration strings must not be replaced.' );
expect_null( Block_Tools::compile_custom_css( 'body { color:red; }', $scope ), 'Global selectors must be rejected.' );
expect_null( Block_Tools::compile_custom_css( 'selector + .sibling { color:red; }', $scope ), 'Sibling scope escape must be rejected.' );
expect_null( Block_Tools::compile_custom_css( 'selector:hover + .sibling { color:red; }', $scope ), 'Sibling scope escape after a pseudo class must be rejected.' );
expect_null( Block_Tools::compile_custom_css( '@import url(https://example.com/a.css);', $scope ), '@import must be rejected.' );
expect_null( Block_Tools::compile_custom_css( '@keyframes x { from { opacity:0 } to { opacity:1 } }', $scope ), '@keyframes must be rejected.' );
expect_null( Block_Tools::compile_custom_css( 'selector { color:red; </style><script>alert(1)</script> }', $scope ), 'Style breakout must be rejected.' );
expect_null( Block_Tools::compile_custom_css( 'selector { color:red;', $scope ), 'Broken rules must be rejected.' );

fwrite( STDOUT, "Block Tools PHP tests passed.\n" );
