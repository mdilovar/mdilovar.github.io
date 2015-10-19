<?php
    session_start();
    if (!$_SESSION["isLoggedIn"]){
        echo json_encode(array("success" => false, "general_message" => "Please login first." ));
        header("location:../index.php");
        exit();
    }
?>
<!DOCTYPE html>
<html>
	<head>
		<meta charset=utf-8>
		<title>NxNxN Rubik's Cube</title>
		<style>
			body { margin: 0; background-color: #f0f0f0; overflow: hidden;}
			canvas { width: 100%; height: 100%}
		</style>
	</head>
	<body>
		<script src="../js/three.min.js"></script>
		<script src="../js/OrbitControls.js"></script>
		<script src="../js/TrackballControls.js"></script>
		<script src="../js/EventsControls.js"></script>
		<script src="../js/game.js"></script>
		<script src="../js/cube.js"></script>
	</body>
</html>