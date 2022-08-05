/*
Authors: Onačillová, K., Gallay, M., Péliová, A., Paluba, D., Tokarčík, O., Laubertová, D. 
(For more info contact: katarina.onacillova@upjs.sk)

This code is free and open. 
By using this code and any data derived with it, 
you agree to cite the following reference 
in any publications derived from them:
 
    Onačillová, K., Gallay, M., Paluba, D., Péliová, A., Tokarčík, O., Laubertová, D. 2022: 
    Combining Landsat 8 and Sentinel 2 data in Google Earth Engine 
    to derive higher resolution land surface temperature maps in urban environment

This function selects the Landsat 8 and Sentinel 2 data based on user inputs
and performes the downscaling of LST

###########################################################################################################################################################################
*/

// Set up panels and widgets for display 
// Set up title and summary widgets

// // drawing tools
// var drawingTools = Map.drawingTools();

// // Use the addLayer method on the drawing tools directly.
// var geometries = [ee.Geometry.Polygon(
//         [[[21.134189623651263, 48.82947658234015],
//           [21.134189623651263, 48.57888560664585],
//           [21.433567065057513, 48.57888560664585],
//           [21.433567065057513, 48.82947658234015]]], null, false)];

// drawingTools.addLayer(geometries, 'my_geometry1', 'red');
// This sets the available draw modes. point and line would also be available

var map = ui.Map();
// Prints true since drawingTools() adds drawing tools to the map.
map.drawingTools().setDrawModes(["polygon", "rectangle"])
// Replace the default Map with the newly created map.
ui.root.widgets().reset([map]);

// App title
var header = ui.Label('Landsat Land Surface Temperature downscaling using Sentinel-2', {fontSize: '23px', fontWeight: 'bold', color: '77797e'});

// App summary
var text = ui.Label(
  'Landsat land surface temperature downscaled at 10 m by Sentinel-2 data. ' +
  'Developed for urban management.',
    {fontSize: '15px'});

// App title2
var header2 = ui.Label('How to cite:', {fontSize: '16px', fontWeight: 'bold'});

// App summary2
var text2 = ui.Label(
  'Onačillová, K., Gallay, M., Paluba, D., Péliová, A., Tokarčík, O., Laubertová, D. 2022: Combining Landsat 8 and Sentinel 2 data in Google Earth Engine to derive higher resolution land surface temperature maps in urban environment Remote Sensing. DOI: ',
    {fontSize: '15px'});

// Create a panel to hold text
var panel = ui.Panel({
  widgets:[header, text, header2, text2],//Adds header and text
  style:{width: '400px',position:'middle-right'}});
  
// Create variable for additional text and separators

// This creates another panel to house a line separator and instructions for the user
var intro = ui.Panel([
  ui.Label({
    value: '__________________________________________________________',
    style: {fontWeight: 'bold',  color: '77797e'},
  })]);

// Add panel to the larger panel 
panel.add(intro)

// Add main panel to the root of GUI
ui.root.insert(1,panel)



// Defining startDate and endDate in the UI
var dateLabel = ui.Label({
    value:'Select start and end dates to find a proper L8/9 and S2 image pair',
    style: {fontWeight: 'bold', fontSize: '14px', margin: '10px 5px'}
  })

var startLabel = ui.Label({
    value:'Start date',
    style: {margin: '0 55px 0 10px',fontSize: '12px',color: 'gray'}
  })
var endLabel = ui.Label({
    value:'End date',
    style: {margin: '0 0px 0 10px',fontSize: '12px',color: 'gray'}
  })
var startDate_selected = ui.Textbox({placeholder: 'Start Date',  value: '2018-08-21',
  style: {width: '100px'}});
var endDate_selected = ui.Textbox({placeholder: 'End Date',  value: '2018-08-27',
  style: {width: '100px'}});
  
var Landsat_collection_label = ui.Label('Choose a Landsat Collection',
  {fontWeight: 'bold', fontSize: '14px', margin: '10px 5px'});

var cloudSliderLabel = ui.Label('Set the maximum cloud coverage (in %)',
  {fontWeight: 'bold', fontSize: '14px', margin: '10px 5px'});

// Define labels for Landsat 8 and 9 Collections
var L8 = 'Landsat 8 Image Collection',
    L9 = 'Landsat 9 Image Collection';

// Define the select button for the AOI
var selectCollection = ui.Select({
  items:[L8,L9],
  placeholder:'Select Landsat Collection',value: 'Landsat 8 Image Collection'
  });

function setLandsatCollection(){
  LCOll = selectCollection.getValue();
  if (LCOll == L8){
      collection = "L8";
  }
  else if(LCOll == L9){
      collection = "L9";
  }
};

// Add a slider bar widget
var cloudSlider = ui.Slider({min:0,max:100, style:{width:'200px'}}).setValue(5);

var GenerateImagesButton = ui.Button('Generate Landsat 8/9 and Sentinel-2 Image Collections', generateImsButton);

panel.add(dateLabel)
  .add((ui.Panel([startLabel, endLabel],ui.Panel.Layout.flow('horizontal'))))
  .add((ui.Panel([startDate_selected, endDate_selected],ui.Panel.Layout.flow('horizontal'))))
  .add(Landsat_collection_label)
  .add(selectCollection)
  .add(cloudSliderLabel)
  .add(cloudSlider)
  .add(GenerateImagesButton);

// Define input parameters
var startDate = startDate_selected.getValue(),
    endDate = endDate_selected.getValue(),
    collection = selectCollection.getValue(), // select "L8" or "L9"
    // selected_geometry = map.drawingTools().layers().get(0).toGeometry(),
    cloud_cover = ee.Number(cloudSlider.getValue());

var ROI = /* color: #98ff00 */ee.Geometry.Polygon(
        [[[21.134189623651263, 48.82947658234015],
          [21.134189623651263, 48.57888560664585],
          [21.433567065057513, 48.57888560664585],
          [21.433567065057513, 48.82947658234015]]], null, false);

map.centerObject(ROI,12);
map.drawingTools().addLayer([ROI], 'ROI', 'green')

function generateImsButton () {
var selected_geometry = map.drawingTools().layers().get(0).toGeometry();
// var selected_geometry = ROI;

  // Set image collection conditions
if (selectCollection.getValue() == "Landsat 8 Image Collection") {
  var collection_id = "LANDSAT/LC08/C02/T1_L2";
} 
if (selectCollection.getValue() == "Landsat 9 Image Collection") {
  var collection_id = "LANDSAT/LC09/C02/T1_L2";
} 
//Select Landsat 8 Surface Reflectance dataset coverage 
var Landsat_collection = ee.ImageCollection(collection_id)      //Select the ImageCollection
                    .filterBounds(selected_geometry)                         //Filter the ImageCollection by your study area
                    .filterDate(startDate_selected.getValue(), endDate_selected.getValue())            //Filter the ImageCollection by the date interval
                    .filterMetadata("CLOUD_COVER", "less_than", ee.Number(cloudSlider.getValue()));   //Filter the ImageCollection by the % of the cloud cover
print(Landsat_collection, "- available Landsat images","that meet the input criteria"); /*Print available features (datasets) of Landsat_collection 
                                        that meet the input criteria - see the results in the Console window*/

//Select Sentinel-2 Level-2A collection dataset coverage 
var S2_collection = ee.ImageCollection("COPERNICUS/S2_SR")
                .filterBounds(selected_geometry)
                .filterDate(startDate_selected.getValue(), endDate_selected.getValue())
                .filterMetadata("CLOUDY_PIXEL_PERCENTAGE", "less_than", ee.Number(cloudSlider.getValue()));
print(S2_collection, "- available Sentinel-2 images","that meet the input criteria");

var landsatList = Landsat_collection.toList(Landsat_collection.size())
var landsatImagesText = "";

if ((Landsat_collection.size().getInfo() > 0) && (S2_collection.size().getInfo()>0)) {
    for (var i=0; i<Landsat_collection.size().getInfo();i++) {
      landsatImagesText = ee.String(landsatImagesText).cat(ee.Image(landsatList.get(i)).id()).cat('; ')
    }
    
    var available_imagesLabel = ui.Label({
        value:'Available Landsat image IDs:',
        style: {margin: '0 0 0 10px',fontSize: '14px'}
      })
    var available_images = ui.Label({
        value: landsatImagesText.getInfo(),
        style: {margin: '0 0 0 10px',fontSize: '12px',color: 'gray'}
      })
    
    var S2List = S2_collection.toList(S2_collection.size())
    var S2ImagesText = "";
    
    for (var i=0; i<Landsat_collection.size().getInfo();i++) {
      S2ImagesText = ee.String(S2ImagesText).cat(ee.Image(S2List.get(i)).id()).cat('; ')
    }
    
    var available_imagesLabel_S2 = ui.Label({
        value:'Available Sentinel-2 image IDs:',
        style: {margin: '0 0 0 10px',fontSize: '14px'}
      })
    var available_images_S2 = ui.Label({
        value: S2ImagesText.getInfo(),
        style: {margin: '0 0 0 10px',fontSize: '12px',color: 'gray'}
      })
    
    panel.add(available_imagesLabel)
          .add(available_images)
          .add(available_imagesLabel_S2)
          .add(available_images_S2)
  
  
  
  var IDLabels = ui.Label({
      value:'Enter the selected image IDs',
      style: {fontWeight: 'bold', fontSize: '14px', margin: '10px 5px'}
    })
    
  var LandsatLabel = ui.Label({
      value:'Enter the selected Landsat ID',
      style: {margin: '0 0 0 10px',fontSize: '12px',color: 'gray'}
    })
    
  var S2Label = ui.Label({
      value:'Enter the selected Sentinel-2 ID',
      style: {margin: '0 0 0 10px',fontSize: '12px',color: 'gray'}
    })
  
  var LandsatID = ui.Textbox({placeholder: 'Start Date',  value: 'LANDSAT/LC08/C02/T1_L2/LC08_186026_20180823',
    style: {width: '350px'}});
  
  var S2ID = ui.Textbox({placeholder: 'End Date',  value: 'COPERNICUS/S2_SR/20180823T094029_20180823T094320_T34UEU',
    style: {width: '350px'}});
  
  panel.add(IDLabels)
    .add(LandsatLabel)
    .add(LandsatID)
    .add(S2Label)
    .add(S2ID)
  
  function GenerateOtherParts () {
  var selected_geometry = map.drawingTools().layers().get(0).toGeometry();
  // var selected_geometry = ROI;
  
  // To be filled after the first RUN
  var S2_selected_dataset = ee.Image(S2ID.getValue()), //Select one feature (dataset) of the printed S2_collection
      Landsat_selected_dataset = ee.Image(LandsatID.getValue()); //Select one feature (dataset) of the printed Landsat_collection
  
  var S2_date = S2_selected_dataset.get('system:time_start');
  var S2_StartDate = ee.Date(S2_date).format('YYYY-MM-dd');
  var S2_EndDate = ee.Date(ee.Number.parse(S2_date).add(86400000)).format('YYYY-MM-dd');
  
  var L_date = Landsat_selected_dataset.get('system:time_start');
  var L_StartDate = ee.Date(L_date).format('YYYY-MM-dd');
  var L_EndDate = ee.Date(ee.Number.parse(L_date).add(86400000)).format('YYYY-MM-dd');
  
  //Select Landsat 8 Surface Reflectance dataset coverage 
  var selected_Landsat_collection = ee.ImageCollection(collection_id)      //Select the ImageCollection
                      .filterBounds(selected_geometry)                         //Filter the ImageCollection by your study area
                      .filterDate(L_StartDate, L_EndDate)            //Filter the ImageCollection by the date interval
                      .filterMetadata("CLOUD_COVER", "less_than", ee.Number(cloudSlider.getValue()))   //Filter the ImageCollection by the % of the cloud cover
                      .first();
  
  Landsat_selected_dataset = selected_Landsat_collection
  
  //Select Sentinel-2 Level-2A collection dataset coverage 
  var selected_S2_collection = ee.ImageCollection("COPERNICUS/S2_SR")
                  .filterBounds(selected_geometry)
                  .filterDate(S2_StartDate, S2_EndDate)
                  .filterMetadata("CLOUDY_PIXEL_PERCENTAGE", "less_than", ee.Number(cloudSlider.getValue()))
                  .median();
  
  // Apply Scaling factors to Landsat 8/9 Collection 2 images
  function applyScaleFactors(image) {
    var opticalBands = image.select('SR_B.').multiply(0.0000275).add(-0.2).multiply(10000);
    var thermalBands = image.select('ST_B.*').multiply(0.00341802).add(149.0).subtract(273.15);
    return image.addBands(opticalBands, null, true)
                .addBands(thermalBands, null, true);
  }
  
  // Landsat_collection = Landsat_collection.map(applyScaleFactors);
  Landsat_selected_dataset = applyScaleFactors(Landsat_selected_dataset);
  
  //Visualization parameters for color compositions RGB, CIR
  var vizParams2 = {bands: ['SR_B4', 'SR_B3', 'SR_B2'],
                    min: 0,
                    max: 3000,
                    gamma: 1.4,};
  
  // var vizParams3 = {bands: ['SR_B5', 'SR_B4', 'SR_B3'],
  //                   min: 0,
  //                   max: 3000,
  //                   gamma: 1.4,};
  
  // ####################################################################################################################
  
  //Visualise the Landsat 8 Surface Reflectance image as a natural colour image (30m spatial resolution)
  
  var L8_image = Landsat_selected_dataset.clip(selected_geometry);
  print(L8_image, 'Landsat-8 clipped Landsat_selected_dataset');
  
  // Map.addLayer(L8_image, vizParams2, "L8_image 30m", 0);
  
  //Select and visualise the Landsat 8 Surface Reflectance image as a colour infrared image (30m spatial resolution).
  // var image2 = ee.Image("LANDSAT/LC08/C01/T1_SR/LC08_186026_20180823").clip(selected_geometry);
  
  // Map.addLayer(image2, vizParams3, "L8 CIR 30m", 0);
  
  // ####################################################################################################################
  
  //Calculate Landsat 8 spectral indices NDVI, NDWI and NDBI
  
  //Landsat 8 NDVI (30m spatial resolution)
  var ndvi = Landsat_selected_dataset.normalizedDifference(['SR_B5', 'SR_B4']).rename('ndvi');
  var ndviParams = {min: -1, max: 1, palette: ['purple', 'pink', 'green']};
  var ndviclipped = ndvi.clip(selected_geometry);
  // print(ndviclipped,'ndvi');
  // Map.addLayer(ndviclipped, ndviParams, 'L8_ndvi', 0);
  
  
  //Landsat 8 NDWI (30m spatial resolution).
  var ndwi = Landsat_selected_dataset.normalizedDifference(['SR_B3', 'SR_B5']).rename('ndwi');
  var ndwiParams = {min: -1, max: 1, palette: ['green', 'yellow', 'red', 'blue', 'navy']};
  var ndwiclipped = ndwi.clip(selected_geometry);
  //print(ndwiclipped,'ndwi');
  //Map.addLayer(ndwiclipped, ndwiParams, 'L8_ndwi');
  
  //Landsat 8 NDBI (30m spatial resolution).
  var ndbi = Landsat_selected_dataset.normalizedDifference(['SR_B6', 'SR_B5']).rename('ndbi');
  var ndbiParams = {min: -1, max: 1, palette: ['blue', 'yellow', 'red']};
  var ndbiclipped = ndbi.clip(selected_geometry);
  //print(ndbiclipped,'ndbi');
  //Map.addLayer(ndbiclipped, ndbiParams, 'L8_ndbi');
  
  
  // ####################################################################################################################
  
  //Calculate Landsat 8 LST in Celsius Degrees (30m spatial resolution))
  var L8_LST_30m = L8_image.select('ST_B10').rename('L8_LST_30m');
  
  //min max L8_LST_30m
  var min = ee.Number(L8_LST_30m.reduceRegion({
            reducer: ee.Reducer.min(),
            scale: 30,
            maxPixels: 1e9
            }).values().get(0));
  
  var max = ee.Number(L8_LST_30m.reduceRegion({
            reducer: ee.Reducer.max(),
            scale: 30,
            maxPixels: 1e9
            }).values().get(0));
  
  print("Landsat 8 LST range (°C)", 
        "- 30m spatial resolution:", "", min, 'min L8 LST (30m)', "", max, 'max L8 LST (30m)');
  
  // Map.addLayer(L8_LST_30m, {min: 21.157310795087767, max:41.58105080520278, //set LST min max
  //             palette: ['040274', '040281', '0502a3', '0502b8', '0502ce', '0502e6',
  //                       '0602ff', '235cb1', '307ef3', '269db1', '30c8e2', '32d3ef',
  //                       //'3be285', '3ff38f', '86e26f', '3ae237', 'b5e22e', 
  //                       'd6e21f', 'fff705', 'ffd611', 'ffb613', 'ff8b13', 'ff6e08', 'ff500d',
  //                       'ff0000', 'de0101', 'c21301', 'a71001', '911003']},'L8-LST 30m');
   
   Export.image.toDrive({
    image: L8_LST_30m,
    description: 'L8_LST_30m',
    folder: "image EE",
    scale: 30,
    region: selected_geometry,
    fileFormat: 'GeoTIFF',
    formatOptions: {
      cloudOptimized: true
    }
  });
  
  // ####################################################################################################################
  
  var medianpixels = selected_S2_collection
  var S2_image = medianpixels.clip(selected_geometry).divide(10000)   
  
  // ####################################################################################################################
  
  // //Select and visualise the Sentinel 2 image as a natural colour image (10m spatial resolution).
  // Map.addLayer(S2_image, {bands: ['B4', 'B3', 'B2'], min: 0, max: 0.23}, 'S2 RGB 10m', 0);
  
  // //Select and visualise the Sentinel 2 image as a colour infrared image (10m spatial resolution).
  // Map.addLayer(S2_image, {bands: ['B8', 'B4', 'B3'], min: 0, max: 0.23}, 'S2 CIR 10m', 0);
  
  // ####################################################################################################################
  
  //Calculate Sentinel 2 spectral indices NDVI, NDWI and NDBI
  
  //Sentinel 2 NDVI (10m spatial resolution).
  var S2_ndvi = S2_image.normalizedDifference(['B8', 'B4']).rename('S2_NDVI');
  var S2_ndviParams4 = {min: -1, max: 1, palette: ['purple', 'pink', 'green']};
  var S2_ndviclipped = S2_ndvi.clip(selected_geometry);
  //print(S2_ndviclipped,'S2_ndvi');
  //Map.addLayer(S2_ndviclipped, S2_ndviParams4, 'S2_ndvi');
  
  //Sentinel 2 NDWI (10m spatial resolution).
  var S2_ndwi = S2_image.normalizedDifference(['B3', 'B11']).rename('S2_NDWI');
  var S2_ndwiParams4 = {min: -1, max: 1, palette: ['green', 'yellow', 'red', 'blue', 'navy']};
  var S2_ndwiclipped = S2_ndwi.clip(selected_geometry);
  //print(S2_ndwiclipped,'S2_ndwi');
  //Map.addLayer(S2_ndwiclipped, S2_ndwiParams4, 'S2_ndwi');
  
  //Sentinel 2 NDBI (10m spatial resolution).
  var S2_ndbi = S2_image.normalizedDifference(['B11', 'B8']).rename('S2_NDBI');
  var S2_ndbiParams4 = {min: -1, max: 1, palette: ['blue', 'yellow', 'purple']};
  var S2_ndbiclipped = S2_ndbi.clip(selected_geometry);
  //print(S2_ndbiclipped,'S2_ndbi');
  //Map.addLayer(S2_ndbiclipped, S2_ndbiParams4, 'S2_ndbi');
  
  
  // ####################################################################################################################
  //Create CHART for linearRegression
  //Sentinel 2 NDVI tab
  var reduced = ee.Image(1).rename('constant')
    .addBands(ndvi)
    .addBands(L8_LST_30m)
    .float()
    .reduceRegion({
      reducer: ee.Reducer.linearRegression(2, 1),
      geometry: selected_geometry,
      scale: 30,
      bestEffort: true,
      maxPixels: 10
    })
  var coefficients = ee.Array(reduced.get('coefficients'))
  var offset = coefficients.get([0, 0])
  var slope = coefficients.get([1, 0])
  var r2 = ee.Array(reduced.get('residuals')).get([0])
  var errors = 3 // How many r2 away to highlight
  
  var samples = ndvi
    .addBands(L8_LST_30m)
    .select(['ndvi', 'L8_LST_30m'])
    .sample({
      region: selected_geometry,
      scale: 30,
      numPixels: 500,
      geometries: true
    })
    .map(function (sample) {
      var ndvi = sample.getNumber('ndvi')
      var model = ndvi.multiply(slope).add(offset)
      var upper = model.add(r2.multiply(errors))
      var lower = model.subtract(r2.multiply(errors))
      return ee.FeatureCollection([
        sample.set('series', 'observations'),
        ee.Feature(sample.geometry(), {
          ndvi: ndvi,
          L8_LST_30m: upper,
          series: 'upper'
        }),
        ee.Feature(sample.geometry(), {
          ndvi: ndvi,
          L8_LST_30m: model,
          series: 'model'
        }),
        ee.Feature(sample.geometry(), {
          ndvi: ndvi,
          L8_LST_30m: lower,
          series: 'lower'
        })
      ])
    })
    .flatten()
  
  var chart1 = ui.Chart.feature
    .groups({
      features: samples, 
      xProperty: 'ndvi', 
      yProperty: 'L8_LST_30m', 
      seriesProperty: 'series'
    })
    .setChartType('ScatterChart')
    .setOptions({
    title: 'Correlation LST - NDVI  based on Landsat 8/9 image',
    legend: {position: 'none'},
    hAxis: {title: 'NDVI'},
    vAxis: {title: 'LST (°C)'},
      series: {
        0: {pointSize: 1, color: 'blue'}, // observations
        1: {lineWidth: 1, color: 'lightgray', pointSize: 0}, // upper
        2: {lineWidth: 1, color: 'red', pointSize: 0}, // model
        3: {lineWidth: 1, color: 'lightgray', pointSize: 0} // lower
      },
      
    })
  
  // print(chart)
  print('intercept', offset, '', 'slope', slope, '', 'r2', r2)
  
  //Sentinel 2 NDWI tab
  print ("")
  var reduced = ee.Image(1).rename('constant')
    .addBands(ndwi)
    .addBands(L8_LST_30m)
    .float()
    .reduceRegion({
      reducer: ee.Reducer.linearRegression(2, 1),
      geometry: selected_geometry,
      scale: 30,
      bestEffort: true,
      maxPixels: 10
    })
  var coefficients = ee.Array(reduced.get('coefficients'))
  var offset = coefficients.get([0, 0])
  var slope = coefficients.get([1, 0])
  var r2 = ee.Array(reduced.get('residuals')).get([0])
  var errors = 3 // How many r2 away to highlight
  
  var samples = ndwi
    .addBands(L8_LST_30m)
    .select(['ndwi', 'L8_LST_30m'])
    .sample({
      region: selected_geometry,
      scale: 30,
      numPixels: 500,
      geometries: true
    })
    .map(function (sample) {
      var ndwi = sample.getNumber('ndwi')
      var model = ndwi.multiply(slope).add(offset)
      var upper = model.add(r2.multiply(errors))
      var lower = model.subtract(r2.multiply(errors))
      return ee.FeatureCollection([
        sample.set('series', 'observations'),
        ee.Feature(sample.geometry(), {
          ndwi: ndwi,
          L8_LST_30m: upper,
          series: 'upper'
        }),
        ee.Feature(sample.geometry(), {
          ndwi: ndwi,
          L8_LST_30m: model,
          series: 'model'
        }),
        ee.Feature(sample.geometry(), {
          ndwi: ndwi,
          L8_LST_30m: lower,
          series: 'lower'
        })
      ])
    })
    .flatten()
  
  var chart2 = ui.Chart.feature
    .groups({
      features: samples, 
      xProperty: 'ndwi', 
      yProperty: 'L8_LST_30m', 
      seriesProperty: 'series'
    })
    .setChartType('ScatterChart')
    .setOptions({
    title: 'Correlation LST - NDWI  based on Landsat 8/9 image',
    legend: {position: 'none'},
    hAxis: {title: 'NDWI'},
    vAxis: {title: 'LST (°C)'},
      series: {
        0: {pointSize: 1, color: 'blue'}, // observations
        1: {lineWidth: 1, color: 'lightgray', pointSize: 0}, // upper
        2: {lineWidth: 1, color: 'red', pointSize: 0}, // model
        3: {lineWidth: 1, color: 'lightgray', pointSize: 0} // lower
      },
      
    })
  
  // print(chart)
  print(
    'intercept', offset, '', 'slope', slope, '', 'r2', r2
  )
  
  
  //Sentinel 2 NDBI tab
  print ("")
  var reduced = ee.Image(1).rename('constant')
    .addBands(ndbi)
    .addBands(L8_LST_30m)
    .float()
    .reduceRegion({
      reducer: ee.Reducer.linearRegression(2, 1),
      geometry: selected_geometry,
      scale: 30,
      bestEffort: true,
      maxPixels: 10
    })
  var coefficients = ee.Array(reduced.get('coefficients'))
  var offset = coefficients.get([0, 0])
  var slope = coefficients.get([1, 0])
  var r2 = ee.Array(reduced.get('residuals')).get([0])
  var errors = 3 // How many r2 away to highlight
  
  var samples = ndbi
    .addBands(L8_LST_30m)
    .select(['ndbi', 'L8_LST_30m'])
    .sample({
      region: selected_geometry,
      scale: 30,
      numPixels: 500,
      geometries: true
    })
    .map(function (sample) {
      var ndbi = sample.getNumber('ndbi')
      var model = ndbi.multiply(slope).add(offset)
      var upper = model.add(r2.multiply(errors))
      var lower = model.subtract(r2.multiply(errors))
      return ee.FeatureCollection([
        sample.set('series', 'observations'),
        ee.Feature(sample.geometry(), {
          ndbi: ndbi,
          L8_LST_30m: upper,
          series: 'upper'
        }),
        ee.Feature(sample.geometry(), {
          ndbi: ndbi,
          L8_LST_30m: model,
          series: 'model'
        }),
        ee.Feature(sample.geometry(), {
          ndbi: ndbi,
          L8_LST_30m: lower,
          series: 'lower'
        })
      ])
    })
    .flatten()
  
  var chart3 = ui.Chart.feature
    .groups({
      features: samples, 
      xProperty: 'ndbi', 
      yProperty: 'L8_LST_30m', 
      seriesProperty: 'series'
    })
    .setChartType('ScatterChart')
    .setOptions({
    title: 'Correlation LST - NDBI  based on Landsat 8/9 image',
    legend: {position: 'none'},
    hAxis: {title: 'NDBI'},
    vAxis: {title: 'LST (°C)'},
      series: {
        0: {pointSize: 1, color: 'blue'}, // observations
        1: {lineWidth: 1, color: 'lightgray', pointSize: 0}, // upper
        2: {lineWidth: 1, color: 'red', pointSize: 0}, // model
        3: {lineWidth: 1, color: 'lightgray', pointSize: 0} // lower
      },
      
    })
  
  // print(chart)
  print(
    'intercept', offset, '', 'slope', slope, '', 'r2', r2
  )
  
  
  // ##########################################################################
  // Regression Calculation 
  
  // preparing bands
  var bands = ee.Image(1).addBands(ndvi).addBands(ndbi).addBands(ndwi).addBands(L8_LST_30m).rename(["constant", "ndvi", "ndbi", "ndwi", "L8"]);
  
  // run the multiple regression analysis
  var imageRegression = bands.reduceRegion({
                        reducer: ee.Reducer.linearRegression({numX:4, numY:1}),
                        geometry: selected_geometry,
                        scale: 30,
                        });
  
  // create images from coefficients
  print ("", "* Multipe linear regression model" ,"coefficients for Landsat 8 LST downscaling")
  var coefList2 = ee.Array(imageRegression.get("coefficients")).toList();
  var intercept2 = ee.Image(ee.Number(ee.List(coefList2.get(0)).get(0)));
  var intercept2_list = ee.List(coefList2.get(0)).get(0);
  var slopeNDVI2 = ee.Image(ee.Number(ee.List(coefList2.get(1)).get(0)));
  var slopeNDVI2_list =  ee.List(coefList2.get(1)).get(0);
  var slopeNDBI2 = ee.Image(ee.Number(ee.List(coefList2.get(2)).get(0)));
  var slopeNDBI2_list =  ee.List(coefList2.get(2)).get(0);
  var slopeNDWI2 = ee.Image(ee.Number(ee.List(coefList2.get(3)).get(0)));
  var slopeNDWI2_list =  ee.List(coefList2.get(3)).get(0);
  
  print(intercept2_list, "intercept", "",
        slopeNDVI2_list, "slope NDVI", "", 
        slopeNDBI2_list, "slope NDBI", "",
        slopeNDWI2_list, "slope NDWI");
  
  // calculate the final downscaled image
  var downscaled_LST_10m = ee.Image(intercept2).add(slopeNDVI2.multiply(S2_ndvi))
              .add(slopeNDBI2.multiply(S2_ndbi)).add(slopeNDWI2.multiply(S2_ndwi));
  
  var lstParams2 = {min: 25, max:50, 
                  palette: ['040274', '040281', '0502a3', '0502b8', '0502ce', '0502e6',
                            '0602ff', '307ef3', '30c8e2', '32d3ef',
                            'fff705', 'ffd611', 'ffb613', 'ff8b13', 'ff6e08', 'ff500d',
                            'ff0000', 'de0101', 'c21301', 'a71001', '911003']};
  
  
  // add to map
  //Map.addLayer(downscaled_LST_10m, lstParams2, 'S2-LST 10m');
  
  // #######################################################################
  // L8-LST 30 m model calculation
  
  var L8_LST_MODEL = intercept2.add(slopeNDVI2.multiply(ndvi))
              .add(slopeNDBI2.multiply(ndbi))
              .add(slopeNDWI2.multiply(ndwi)).clip(selected_geometry);
  
  var L8_RESIDUALS = L8_LST_30m.subtract(L8_LST_MODEL);
  
  var palette = ['040274', '040281', '0502a3', '0502b8', '0502ce', '0502e6',
                        '0602ff', '235cb1', '307ef3', '269db1', '30c8e2', '32d3ef',
                        //'3be285', '3ff38f', '86e26f', '3ae237', 'b5e22e', 
                        'd6e21f', 'fff705', 'ffd611', 'ffb613', 'ff8b13', 'ff6e08', 'ff500d',
                        'ff0000', 'de0101', 'c21301', 'a71001', '911003'];
  
  // Map.addLayer(L8_LST_MODEL, {min: 21.157310795087767, max:41.58105080520278, //set LST min max
  //             palette: palette}, 'L8_LST_MODEL');
  
  
  // ####################################################################### 
  // Gaussian convolution
  
  // Define a gaussian kernel
  var gaussian = ee.Kernel.gaussian({
    radius: 1.5, units: 'pixels'
  });
  
  // Smooth the image by convolving with the gaussian kernel.
  var L8_RESIDUALS_gaussian = L8_RESIDUALS.resample("bicubic").convolve(gaussian);
  
  var visParam_residuals = {
          min: -10,
          max: 9,
          palette: ['blue', 'yellow', 'red']
          };
  
  // Map.addLayer(L8_RESIDUALS, visParam_residuals, "L8_RESIDUALS_original",false);
  // Map.addLayer(L8_RESIDUALS_gaussian, visParam_residuals, "L8_RESIDUALS_gaussian",false);
  
  // 
  // Calculate the final downscaled LSTs
  var downscaled_LST_10m2 = ee.Image(intercept2).add(slopeNDVI2.multiply(S2_ndvi))
                .add(slopeNDBI2.multiply(S2_ndbi)).add(slopeNDWI2.multiply(S2_ndwi));
  
  // Map.addLayer(downscaled_LST_10m2, lstParams2, 'S2-LST 10m (no residuals)');
  
  var S2_LST_10_w_Residuals = downscaled_LST_10m2.add(L8_RESIDUALS_gaussian)
  // var S2_LST_10_w_Residuals_noGauss = downscaled_LST_10m2.add(L8_RESIDUALS.resample("bicubic"))
  // var S2_LST_10_w_Residuals_onlyGAUSS = downscaled_LST_10m2.add(L8_RESIDUALS.convolve(gaussian))
  
  
  // Map.addLayer(S2_LST_10_w_Residuals, {min: 20, max:42, //set LST min max
  //             palette: palette}, "S2_LST_10_w_Residuals");
  // Map.addLayer(S2_LST_10_w_Residuals_noGauss, {min: 21.157310795087767, max:41.58105080520278, //set LST min max
  //             palette: palette}, "S2_LST_10_w_Residuals_noGauss", false);
  // Map.addLayer(S2_LST_10_w_Residuals_onlyGAUSS, {min: 21.157310795087767, max:41.58105080520278, //set LST min max
  //             palette: palette}, "S2_LST_10_w_Residuals_onlyGAUSS", false);
  
  // Export the final image to Drive
  Export.image.toDrive({
    image: S2_LST_10_w_Residuals,
    description: 'Downscaled_LST_usingS2_10m',
    folder: "image EE",
    scale: 10,
    region: selected_geometry,
    crs: 'EPSG:4326',
    maxPixels: 1e12,
    fileFormat: 'GeoTIFF',
    formatOptions: {
      cloudOptimized: true
    }
  });
  
  
  
  // ##################################################################### //
  // #################### User interface preparation ##################### //
  // ##################################################################### //
  
  // Inspiration was taken from Abigail Barenblitt & Temilola Fatoyinbo presentation and code available at
  // https://appliedsciences.nasa.gov/sites/default/files/2020-10/Part3App_Final.pdf
  // https://code.earthengine.google.com/705e6c7974f42373f1b9535e2bd40243
  
  // Setting up map appearance and app layers 
  // Center the map to the selected_geometry
  Map.centerObject(selected_geometry,12); 
  
  // Create variables for GUI layers for each layer 
  var L8_image_viz = ui.Map.Layer(L8_image, vizParams2, "Landsat 8/9 RGB",false);
  var S2_image_viz = ui.Map.Layer(S2_image, {bands: ['B4', 'B3', 'B2'], min: 0, max: 0.23}, 'Sentinel-2 RGB',false);
  var L8_LST_viz = ui.Map.Layer(L8_LST_30m, lstParams2,'L8-LST 30m', false);
  var residuals_layer = ui.Map.Layer(L8_RESIDUALS_gaussian, visParam_residuals, "Landsat 8/9 LST regression residuals",false);
  var L8_LST_10_noResiduals = ui.Map.Layer(downscaled_LST_10m2, lstParams2, 'S2-LST 10m (no residuals)', false);
  var L8_LST_10_with_Residuals = ui.Map.Layer(S2_LST_10_w_Residuals, lstParams2, "S2-LST 10m with residuals", true);
  
  
  // Add layers to the map
  map.add(L8_image_viz);
  map.add(S2_image_viz);
  map.add(residuals_layer);
  map.add(L8_LST_viz);
  map.add(L8_LST_10_noResiduals);
  map.add(L8_LST_10_with_Residuals);
  
  ///////////////////////////////////////////////////////////////
  //            Add checkbox widgets and legends               //
  ///////////////////////////////////////////////////////////////
  
  var selectLayerLabel = ui.Label({
      value:'Select layers to display.',
      style: {fontWeight: 'bold', fontSize: '16px', margin: '10px 5px'}
    });
  
  // Add checkboxes to our display
  var additionalCheck = ui.Checkbox('Landsat 8/9 RGB').setValue(false); 
  var additionalCheck2 = ui.Checkbox('Sentinel-2 RGB').setValue(false);
  var additionalCheck3 = ui.Checkbox('Landsat 8/9 LST').setValue(false);
  var additionalCheck4 = ui.Checkbox('Landsat 8/9 LST regression residuals').setValue(false); 
  var additionalCheck5 = ui.Checkbox('LST 10 m (no residuals)').setValue(false); 
  var additionalCheck6 = ui.Checkbox('LST 10 m with residuals').setValue(true); 
  var additionalCheck7 = ui.Checkbox('ROI').setValue(true); 

  // Create legend
  // Set position of panel
  var legend = ui.Panel({
    style: {
      position: 'bottom-left',
      padding: '8px 15px'
    }
  });
  
  // The following creates and styles 1 row of the legend.
  var makeRowa = function(color, name) {
   
        // Create the label that is actually the colored box.
        var colorBox = ui.Label({
          style: {
            backgroundColor: '#' + color,
            // Use padding to give the box height and width.
            padding: '8px',
            margin: '0 0 4px 0'
          }
        });
   
        // Create a label with the description text.
        var description = ui.Label({
          value: name,
          style: {margin: '0 0 4px 6px'}
        });
   
        // Return the panel
        return ui.Panel({
          widgets: [colorBox, description],
          layout: ui.Panel.Layout.Flow('horizontal')
        });
  };
  
  
  // Legend
  // Legend Label
  var legendLabel = ui.Label({value:'Land Surface Temperature (°C)',
  style: {fontWeight: 'bold', fontSize: '16px', margin: '10px 5px'}
  });
  
  // This uses function to construct a legend for the given single-band vis
  // parameters.  Requires that the vis parameters specify 'min' and 
  // 'max' but not 'bands'.
  function makeLegend (params) {
    var lon = ee.Image.pixelLonLat().select('longitude');
    var gradient = lon.multiply((params.max-params.min)/100.0).add(params.min);
    var legendImage = gradient.visualize(params);
    
    var thumb = ui.Thumbnail({
      image: legendImage, 
      params: {bbox:'0,0,100,8', dimensions:'256x20'},  
      style: {position: 'bottom-center'}
    });
    var panel2 = ui.Panel({
      widgets: [
        ui.Label('25'), 
        ui.Label({style: {stretch: 'horizontal'}}), 
        ui.Label('50')
      ],
      layout: ui.Panel.Layout.flow('horizontal'),
      style: {stretch: 'horizontal', maxWidth: '270px', padding: '0px 0px 0px 0px'}
    });
    return ui.Panel().add(panel2).add(thumb);
  }
  
  var ChartButton = ui.Button('Generate charts of spectral indices vs Landsat 8/9 LST', GenerateCharts);
  
  function GenerateCharts() {
    panel.add(chart1)
        .add(chart2)
        .add(chart3)
  } 
  
  // Add widgets to the panel in an order
  panel.add(selectLayerLabel)
        .add(additionalCheck6)
        .add(additionalCheck5)
        .add(additionalCheck3)
        .add(additionalCheck4)
        .add(additionalCheck2)
        .add(additionalCheck)
        .add(additionalCheck7)
        .add(legendLabel)
        .add(makeLegend(lstParams2))
        .add(ChartButton)
  
  
  ///////////////////////////////////////////////////////////////
  //             Add functionality to widgets                  //
  ///////////////////////////////////////////////////////////////
  
  //For each checkbox we create function so that clicking the checkbox
  //Turns on layers of interest
  
  // L8_image
  var doCheckbox = function() {
    
    additionalCheck.onChange(function(checked){
    L8_image_viz.setShown(checked)
    })
  }
  doCheckbox();
  
  // S2_RGB
  var doCheckbox2 = function() {
    
    additionalCheck2.onChange(function(checked){
    S2_image_viz.setShown(checked)
    })
    
  
  }
  doCheckbox2();
  
  // L8_LST
  var doCheckbox3 = function() {
    
    additionalCheck3.onChange(function(checked){
    L8_LST_viz.setShown(checked)
    })
    
  
  }
  doCheckbox3();
  
  // Residuals
  var doCheckbox4 = function() {
    
    additionalCheck4.onChange(function(checked){
    residuals_layer.setShown(checked)
    })
  }
  doCheckbox4();
  
  // LST 10 m without residuals
  var doCheckbox5 = function() {
    
    additionalCheck5.onChange(function(checked){
    L8_LST_10_noResiduals.setShown(checked)
    })
    
  
  }
  doCheckbox5();
  
  // FINAL downscaled image with residuals
  var doCheckbox6 = function() {
    
    additionalCheck6.onChange(function(checked){
    L8_LST_10_with_Residuals.setShown(checked)
    })
    
  
  }
  doCheckbox6();
  
  var doCheckbox7 = function() {
  
  additionalCheck7.onChange(function(checked){
  map.drawingTools().layers().get(0).setShown(checked)
  })
  

  }
  doCheckbox7();
    
  }
  
  var otherPartsButton = ui.Button('Generate Downscaled LST', GenerateOtherParts);
  
  panel.add(otherPartsButton);
}
  else {
    var Error_message = ui.Label({
      value:'There are 0 images either in Sentinel-2 or Landsat 8/9 Image Collections. Please try to change some parameters and generate images again.',
      style: {margin: '0 0 0 10px',fontSize: '14px', color: 'red'}
    })
    panel.add(Error_message)
  }
  }
