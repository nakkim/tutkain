<?php
require_once("dataMiner.php");
date_default_timezone_set('Europe/Helsinki');

header('Content-Type: application/json');

$timestamp = $_GET["time"];
// $timestamp = "2017-08-12T16:00:00Z/2017-08-12T16:05:00Z/PT5M";

$times = explode("/",$timestamp);
$starttime = new DateTime($times[0]);
$endtime = new DateTime($times[1]);
$timestep = $times[2];

// create a new fake start time for data query
if($timestep == 'PT5M') $starttime = $starttime->modify("-5 minutes");
if($timestep == 'PT15M') $starttime = $starttime->modify("-15 minutes");
$starttime = $starttime->format('Y-m-d\TH:i:s\Z');
$endtime   = $endtime->format('Y-m-d\TH:i:s\Z');

$timeValues = formatDataToTimes($timestamp);

$dataMiner = new DataMiner();
$lightningData = $dataMiner->multipointcoverage($starttime,$endtime);
// $result = resolveTimeIntervals ( $lightningData, $timeValues );

print createGeoJSON($lightningData, $timeValues);



/**
 *
 * create geojson string
 *
 * @param array $data
 * @return string geojson string
 * 
 */

function createGeoJSON ($data, $timeArray) {
  $i = 0;
  
  $str = "[";

  for($x=0; $x<2; $x++) {
    $str .= '{ "type": "FeatureCollection",';
    $str .= '"features": [';

    foreach ($data as $key => $val) {

      if((int)$val['cloud_indicator'] == $x) {
        if(new DateTime($val['time']) > new DateTime($timeArray[$i])) $i++;  

        $str .= '{ "type": "Feature",';
        $str .= '"geometry": {"type": "Point", "coordinates": ['.$val['lon'].', '.$val['lat'].']},';
        $str .= '"properties": {';
        $str .= '"cloud_indicator": "'.$val['cloud_indicator'].'",';
        $str .= '"time": "'.$timeArray[$i].'",';
        $str .= '"strikeTime": "'.$val['time'];    
        $str .= '"}';
        $str .= '},';
      }
    }
    $i=0;
    // remove last comma
    $str = rtrim($str,',');
    $str .= ']},';
  }
  $str = rtrim($str,',');
  $str .= ']';
  return $str;
}


/**
 *
 * Create data array from timestring
 *
 * @param array $data
 * @return string geojson string
 * 
 */

function formatDataToTimes( $timestring ) {

  $timeValues = [];

  $timestamp = explode("/",$timestring);
  $starttime = new DateTime($timestamp[0]);
  $endtime = new DateTime($timestamp[1]);
  $timestep = $timestamp[2];

  array_push($timeValues, $starttime->format('Y-m-d\TH:i:s\Z'));
  $addMoreValues = true;

  while($addMoreValues == true) {

    if($timestep == "PT5M") $starttime->modify('+5 minutes');
    else $starttime->modify('+15 minutes');

    if ($starttime == $endtime) {
      array_push($timeValues, $starttime->format('Y-m-d\TH:i:s\Z'));
      $addMoreValues = false;
    } else {
      array_push($timeValues, $starttime->format('Y-m-d\TH:i:s\Z'));
    }
  }

  return $timeValues;
}


/**
 *
 * cut lightning data into intervals
 *
 * @param array $lightningData
 * @param array $timeValues
 * @return array data array
 * 
 */

function resolveTimeIntervals ( $lightningData, $timeValues ) {
  $result = [];
  $i = 0;
  foreach($timeValues as $time) {
    $result[$time] = [];
    while($i < count($lightningData)-1) {
      if( new DateTime($lightningData[$i]['time']) < new DateTime($time) ) {
        array_push($result[$time], $lightningData[$i]);
        $i++;
      } else {
        $i++;
        break;
      }
    }
  }
  return $result;
}