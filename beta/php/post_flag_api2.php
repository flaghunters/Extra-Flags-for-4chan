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
$post_nr = $_POST['post_nr'];
$regions = $_POST['regions'];
$board = $_POST['board'];

//only numbers allowed in post_nr
$post_nr = preg_replace("/[^0-9]/i","", $post_nr);

if (!strlen($post_nr)){
	die("post_nr is empty");
}

//list for flags
$flaglist = file('https://raw.githubusercontent.com/flaghunters/Extra-Flags-for-int-/master/php/flag_list.txt', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

$regionsArray = explode('||', $regions);

foreach ($regionsArray as $region) {
	if (!in_array($region, $flaglist)) {
		$regions = "Region empty, no flag yet or you did not set.";
	}
}

//strip to be sure
$regions = strip_tags($regions, '');

//create pdo array
$pdo_array=array("$post_nr", "$board", "$regions");

try {
	//pdo connection
    $pdo = new PDO("mysql:host=$db_host;dbname=$db_name", $db_user, $db_pass);
    //pdo query
    $sql = "INSERT INTO $db_table(post_nr, board, region) VALUES (?, ?, ?)";
    $stm = $pdo->prepare($sql);
    $stm->execute($pdo_array);

    $pdo = null;
}
catch(PDOException $e){
}
?>
