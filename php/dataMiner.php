<?php
ini_set('memory_limit', '-1');

/**
 * DataMiner class
 * @author Ville Ilkka
 */

class DataMiner{

    function __construct(){

    }


    /**
     *
     * download and parse lightning data from FMI open data
     *
     * @param    string  $starttime time interval start
     * @param    string  $endtime   time interval end
     * @param    string  $timestep  time interval timestep
     * @return   array
     *
     */
  
    public function multipointcoverage($starttime,$endtime) {
        date_default_timezone_set("UTC");
        
        $settings = array();
        $settings["parameter"]      = "cloud_indicator";
        $settings["storedQueryId"]  = "fmi::observations::lightning::multipointcoverage";
        $settings["bbox"]           = "16.58,58.81,34.8,70.61";

        $url = "";
        $url .= "http://opendata.fmi.fi/wfs?request=getFeature";
        $url .= "&storedquery_id={$settings["storedQueryId"]}";
        $url .= "&parameters={$settings["parameter"]}";
        $url .= "&starttime={$starttime}";
        $url .= "&endtime={$endtime}";
        // $url .= "&bbox={$settings["bbox"]},epsg::4326&";

        $xmlData = file_get_contents($url);
        if($xmlData == false) {
            return [];
        }
        if($xmlData == "") {
            return [];
        }

        $resultString = simplexml_load_string($xmlData);

        $result = array();
        $tmp = array();
        $final = [];

        $data = $resultString->children("wfs", true);
        $params = explode(",", $settings["parameter"]);

        $result1 = [];
        $result2 = [];
        foreach ($data->member as $key => $locations) {            
            // coordinates and timestamps
            $latlons = $locations
                    -> children("omso", true)->GridSeriesObservation
                    -> children("om", true)->result
                    -> children("gmlcov", true)->MultiPointCoverage
                    -> children("gml", true)->domainSet
                    -> children("gmlcov", true)->SimpleMultiPoint
                    -> children("gmlcov", true)->positions;

            $latlons = explode("                ",(string)$latlons);
            $numberOfStations = count($latlons);
            $i = 0;
            $timestamps = [];
            foreach ($latlons as $latlon) {
                $tmp = [];
                if($i>0 && $i<($numberOfStations-1)) {
                    $latlon = explode(" ",(string)$latlon);
                    $tmp["lat"] = floatval($latlon[0]);
                    $tmp["lon"] = floatval($latlon[1]);
                    $tmp["epoctime"] = floatval($latlon[2]);

                    // convert UNIX timestamp to time
                    $tmp["time"] = date("Y-m-d\TH:i:s\Z", $tmp["epoctime"]);
                    array_push($timestamps,$tmp);
                }
                $i++;
            }

            // actual observations
            $parameters = explode(",",$settings["parameter"]);
            $observations = $locations
                    -> children("omso", true)->GridSeriesObservation
                    -> children("om", true)->result
                    -> children("gmlcov", true)->MultiPointCoverage
                    -> children("gml", true)->rangeSet
                    -> children("gml", true)->DataBlock
                    -> children("gml", true)->doubleOrNilReasonTupleList;
            $observations = explode("                ",(string)$observations);

            $tmp = [];
            foreach($observations as $key => $observation) {
                if($key > 0 and $key < (count($observations)-1))
                $tmp[$key] = explode(" ",$observation);
            }

            $observations = [];
            foreach($tmp as $observation) {
                for($x=0; $x<count($parameters); $x++) {
                    if(is_numeric($observation[$x]) === true) {
                        $tmp2[$parameters[$x]] = floatval($observation[$x]);
                    } else {
                        $tmp2[$parameters[$x]] = null;
                    }

                }
                array_push($observations,$tmp2);
            }
            // merge arrays
            foreach($observations as $key => $observation) {
                array_push($final,array_merge($timestamps[$key],$observations[$key]));
            }
        }
        return $final;
    }
    // end of class
}


?>
