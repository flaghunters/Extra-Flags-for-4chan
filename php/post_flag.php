<?php
error_reporting(0);

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
$post_nr = $_POST['post_nr'];
$real_flag = $_POST['real_flag'];
$region = $_POST['region'];

//fix cheats
$region = str_replace('/', '', $region);
$region = str_replace('.', '', $region);
//fix second set of cheats
$region = str_replace('%2F', '', $region);
$region = str_replace('%2E', '', $region);

try {
	//pdo connection
    $pdo = new PDO("mysql:host=$db_host;dbname=$db_name", $db_user, $db_pass);
    //pdo query
    $count = $pdo->exec("INSERT INTO $db_table(post_nr, real_flag, region) VALUES ('$post_nr', '$real_flag', '$region')");
    //close db
    $pdo = null;
}
catch(PDOException $e){
}
?>
