<?php
header('Content-type: text/javascript');
// read data from cetcapabilities

$serviceURL = filter_input(INPUT_GET, 'server', FILTER_SANITIZE_STRING);
$layerName = filter_input(INPUT_GET, 'name'  , FILTER_SANITIZE_STRING);

$dataValues = array();
$url = "https:{$serviceURL}?service=WMS&version=1.3.0&request=GetCapabilities";
$xmlData = file_get_contents($url);

$resultString = simplexml_load_string($xmlData);
$data = $resultString->Capability->Layer->Layer;

$results = array();

foreach($data as $layer) {
  $dataArray = array();
  $dataArray["title"] = (string)$layer->Title;
  $dataArray["name"] = (string)$layer->Name;
  $dataArray["abstract"] = (string)$layer->Abstract;
  $dataArray["crs"] = (string)$layer->CRS;
  $dataArray["dimension"] = (string)$layer->Dimension;

  if(($dataArray["name"]) === $layerName) {
    array_push($results, $dataArray);
  }

}

if($results[0]["name"] === "meteosat:msg_eview_3995") {
  $altResult = [];
  $altResult = $results[0];
  $dimensions = explode(",",$altResult["dimension"]);
  $output = $dimensions[0]."/".end($dimensions)."/PT15M";
  $altResult["dimension"] = $output;
  print json_encode($altResult,true);
} else {
  print json_encode($results[0],true);
}