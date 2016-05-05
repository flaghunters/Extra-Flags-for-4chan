<?php
//error_reporting(0);

//variables
$db_host = "";
$db_name = "";
$db_user = "";
$db_pass = "";
$db_table = "";

//prevent GET requests to this script
if($_SERVER['REQUEST_METHOD'] == 'GET'){
	echo "No GET allowed.";
    exit();
}

//get POST variables
$board = $_POST['board'];
$post_nrs = $_POST['post_nrs'];
//this is the real array to be used in pdo
$post_nrs2 = explode(",", $post_nrs);
//this is the amount of question marks to be used in pdo
$post_nrs3 = str_repeat('?,', count($post_nrs2) - 1) . '?';

//add one more element to support board in pdo
array_push($post_nrs2, $board);

try {
	//pdo connection
    $pdo = new PDO("mysql:host=$db_host;dbname=$db_name", $db_user, $db_pass);
    //pdo query
    $sql = "SELECT post_nr, region FROM $db_table WHERE post_nr IN ($post_nrs3) AND board = ?";
    $stm = $pdo->prepare($sql);
    $stm->execute($post_nrs2);
    $result = $stm->fetchAll(PDO::FETCH_ASSOC);

    echo(json_encode($result));

    $pdo = null;
}
catch(PDOException $e){
}
?>
