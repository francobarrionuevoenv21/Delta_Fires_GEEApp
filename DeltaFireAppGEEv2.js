// Loading datasets ---------------------------------------------------------------------------
var modisNDWI = ee.ImageCollection("MODIS/MOD09GA_006_NDWI");
var modisNDVI = ee.ImageCollection("MODIS/MOD09GA_006_NDVI") ;
var modisBurnedArea = ee.ImageCollection('MODIS/061/MCD64A1');

// Loading study area vector ------------------------------------------------------------------     
var deltaParana = ee.FeatureCollection('projects/ee-my-francodbarr/assets/shpDelta');
//// Here you can load your own study region.

// Map initial configurations -----------------------------------------------------------------
var polygonStyle = {'color': '000000ff',
  'width': 3,
  'fillColor': '00000000' // Outline width
  };
Map.addLayer(deltaParana.style(polygonStyle), {}, 'Paraná Delta boundaries');
Map.centerObject(deltaParana, 7.8);

// Set time span analysis---------------------------------------------------------------------
var startYear = '2001'; //// First year
var endYear = '2022'; //// Last year, including it
//// Lines aboves determines years that the user will be able to analyze

// App display -------------------------------------------------------------------------------
//// Main panel configuration -/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-
var mainPanel = ui.Panel({
  style: {width: '435px'}
});

ui.root.add(mainPanel);

var title = ui.Label({
  value: 'Paraná Delta Burned Area App v1',
  style: {'fontSize': '24px',
    'fontWeight': 'bold'}
});

function mainPanelTitle(mainPanel){
  mainPanel.add(title);
}

mainPanelTitle(mainPanel);

//// Other panels, selectors and buttons -/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/
var dropdownPanel = ui.Panel({
  layout: ui.Panel.Layout.flow('horizontal'),
});

var introductionTextPanel = ui.Panel({
  layout: ui.Panel.Layout.flow('vertical'),
}).add(ui.Label({
  value: 'The Paraná Delta Burned Area App allows users to easily visualize the burned area and its temporal and spatial distribution along the Paraná River Delta, Argentina, during the period 2001-2022. It also provide valuable insights about vegetation conditions, and humidity and water availability through the NDVI and NDWI indices, respectively. These parameters offer meaningful information for fire risk assessment. All the products used in this app correspond to MODIS derived products (for more information see Sources section)',
  style: {'fontSize': '13px'}
  }));

var instructionPanel = ui.Panel({
  layout: ui.Panel.Layout.flow('vertical'),
});

instructionPanel.add(ui.Label({
  value: 'Instructions',
  style: {'fontSize': '15px',
    'fontWeight': 'bold'}
  }));
instructionPanel.add(ui.Label({value: '1) Check BA time series chart and choose your period of interest in YY-MM',
style: {'fontSize': '13px'}
}));
instructionPanel.add(ui.Label({value: '2) Select the year from your period of interest',
style: {'fontSize': '13px'}
}));
instructionPanel.add(ui.Label({value: '3) Select the month from your period of interest',
style: {'fontSize': '13px'}
}));
instructionPanel.add(ui.Label({value: '4) Press Load',
style: {'fontSize': '13px'}
}));
instructionPanel.add(ui.Label({value: '5) Press Reset to start a new analysis',
style: {'fontSize': '13px'}
}));

var baTSPanel = ui.Panel({
  layout: ui.Panel.Layout.flow('horizontal'),
});

var ddAndButtonTitlePanel = ui.Panel({
  layout: ui.Panel.Layout.flow('vertical'),
}).add(ui.Label({
  value: 'Dropdown selectors and buttons',
  style: {'fontSize': '15px',
  'fontWeight': 'bold'}
  }));

var yearSelector = ui.Select({
placeholder: 'please wait..',
});
  
var monthSelector = ui.Select({
placeholder: 'please wait..',
});

var buttonLoad = ui.Button('Load');
var buttonRes = ui.Button('Reset');

function mainPanelFeatures(ddP, yS, mS, loadB, resetB){
  ddP.add(yS);
  ddP.add(mS);
  ddP.add(loadB);
  ddP.add(resetB);
};

var histResultsTitlePanel = ui.Panel({
  layout: ui.Panel.Layout.flow('vertical'),
}).add(ui.Label({
  value: 'NDVI & NDWI histogram output',
  style: {'fontSize': '15px',
  'fontWeight': 'bold'}
  }));
var histResultsPanel = ui.Panel({
  layout: ui.Panel.Layout.flow('vertical'),
});
  
var sourcesPanel = ui.Panel({
  layout: ui.Panel.Layout.flow('vertical'),
});
sourcesPanel.add(ui.Label({
  value: 'Sources',
  style: {'fontSize': '13px',
    'fontWeight': 'bold'}
  }));
sourcesPanel.add(ui.Label({value: 'Paraná River delta borders vector file: https://www.google.com/maps/d/u/0/viewer?mid=1_ArYZsWx-IvFCsNuXA-Z0u60vVcVLP76&ll=-35.24217356383713%2C-59.32243393359376&z=6',
style: {'fontSize': '11px'}
}));
sourcesPanel.add(ui.Label({value: 'MODIS Burned Area Monthly Global 500m: https://developers.google.com/earth-engine/datasets/catalog/MODIS_061_MCD64A1',
style: {'fontSize': '11px'}
}));
sourcesPanel.add(ui.Label({value: 'MODIS Terra Daily NDVI: https://developers.google.com/earth-engine/datasets/catalog/MODIS_MOD09GA_006_NDVI',
style: {'fontSize': '11px'}
}));
sourcesPanel.add(ui.Label({value: 'MODIS Terra Daily NDWI: https://developers.google.com/earth-engine/datasets/catalog/MODIS_MOD09GA_006_NDWI',
style: {'fontSize': '11px'}
}));
sourcesPanel.add(ui.Label({value: 'Gandhi, Ujaval, 2021. End-to-End Google Earth Engine Course. Spatial Thoughts. https://courses.spatialthoughts.com/end-to-end-gee.html',
style: {'fontSize': '11px'}
}));

var authorPanel = ui.Panel({
  layout: ui.Panel.Layout.flow('vertical'),
});
authorPanel.add(ui.Label({
  value: 'Author',
  style: {'fontSize': '13px',
    'fontWeight': 'bold'}
  }));
authorPanel.add(ui.Label({value: 'Created by Franco Barrionuevo',
style: {'fontSize': '11px'}
}));
authorPanel.add(ui.Label({value: 'Contact: francod.barrionuevo@gmail.com',
style: {'fontSize': '11px'}
}));

//// Burned Area TS chart -/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/
var startDateTS = ee.Date.fromYMD(
    ee.Number.parse(startYear), 1, 1);
var endDateTS = ee.Date.fromYMD(
    ee.Number.parse(endYear), 12, 31);

var roi = deltaParana;

var nMonths = ee.Number(endDateTS.difference(startDateTS, 'month')).round();
var projection = 'EPSG:4326';

var sst = modisBurnedArea.select('BurnDate').filterDate(startDateTS, endDateTS);

var byYear = ee.ImageCollection(
  //// map over each year
  ee.List.sequence(0, nMonths).map(function (n) {
    //// calculate the offset from startDate
    var ini = startDateTS.advance(n, 'month');
    //// advance just one month
    var end = ini.advance(1, 'month');
    //// filter and reduce
    var resul = sst.filterDate(ini, end);

    //// Check if there are images in the collection
    var count = resul.size();
    var burnedArea;
    
    if (count.gt(0)) {
      burnedArea = resul.reduce(ee.Reducer.firstNonNull()).rename('Burned Area');
      
      //// Set the 'system:time_start' property
      burnedArea = burnedArea.set('system:time_start', ini);
    } else {
      //// If no valid data, create an empty image with 'system:time_start'
      burnedArea = ee.Image.constant(0).selfMask().rename('Burned Area').set('system:time_start', ini);
    }
    return burnedArea;
  })
);

var nMonthsMasked = byYear.map(function(image) {
  var pixelBA = image.gt(0);
  //// Unmask it to fill nodata with 0
  return pixelBA.unmask(0)
    .copyProperties(image, ['system:time_start']);
});

var nMonthsArea = nMonthsMasked.map(function(image) {
  var burnedAreaImage = image.multiply(ee.Image.pixelArea());
  //// The area is in square meters. Convert to hectares
  return burnedAreaImage.divide(1000000)
    .copyProperties(image, ['system:time_start']);
});

//// plot full time series
function tsBAplot(){
  var tsBurnedArea =  ui.Chart.image.series({
      imageCollection: nMonthsArea,
      region: roi.geometry(),
      reducer: ee.Reducer.sum(),
      scale: 500
    })
    .setOptions({ title: 'Burned Area over time (2001-2022)', 
    titleTextStyle: { fontSize: 14, bold: true, textAlign: 'center' },
    vAxis: {title: 'Total burned area (km2)'},
    hAxis: {title: 'YY-MM', format: 'YYYY-MMM'},
    series: {0: {color: 'orange'}},
    legend: { position: 'none' },
    }).setChartType('ColumnChart');

  baTSPanel.add(tsBurnedArea);
};

//// Main panel elements add & functions call -/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-
mainPanel.add(introductionTextPanel);
mainPanel.add(instructionPanel);
mainPanel.add(baTSPanel);
tsBAplot();
mainPanel.add(ddAndButtonTitlePanel);
mainPanel.add(dropdownPanel);
mainPanelFeatures(dropdownPanel, yearSelector, monthSelector, buttonLoad, buttonRes);
mainPanel.add(histResultsTitlePanel);
mainPanel.add(histResultsPanel);
mainPanel.add(sourcesPanel);
mainPanel.add(authorPanel);
 
//// Setting dropdown buttons -/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-
var years = ee.List.sequence(ee.Number.parse(startYear), ee.Number.parse(endYear));
var months = ee.List.sequence(1, 12);

var yearStrings = years.map(function(year){
  return ee.Number(year).format('%04d');
});
var monthStrings = months.map(function(month){
  return ee.Number(month).format('%02d');
});

yearStrings.evaluate(function(yearList) {
  yearSelector.items().reset(yearList);
  yearSelector.setPlaceholder('select a year');
});

monthStrings.evaluate(function(monthList) {
  monthSelector.items().reset(monthList);
  monthSelector.setPlaceholder('select a month');
});

// Extra functions ----------------------------------------------------------------------------
//// Color bars for NDVI & NDWI /-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/
function createColorBar(titleText, palette, min, max) {
  //// Legend Title
  var title = ui.Label({
    value: titleText, 
    style: {fontWeight: 'bold', textAlign: 'center', stretch: 'horizontal'}});

  //// Colorbar
  var legend = ui.Thumbnail({
    image: ee.Image.pixelLonLat().select(0),
    params: {
      bbox: [0, 0, 1, 0.1],
      dimensions: '200x20', //200X2'
      format: 'png', 
      min: 0, max: 1,
      palette: palette},
    style: {stretch: 'horizontal', margin: '8px 8px', maxHeight: '40px'},
  });
  
  //// Legend Labels
  var labels = ui.Panel({
    widgets: [
      ui.Label(min, {margin: '4px 10px',textAlign: 'left', stretch: 'horizontal'}),
      ui.Label(max, {margin: '4px 10px',textAlign: 'right', stretch: 'horizontal'})],
    layout: ui.Panel.Layout.flow('horizontal')});
  
  //// Create a panel with all 3 widgets
  var legendPanel = ui.Panel({
    widgets: [title, legend, labels],
    style: {position: 'bottom-right', padding: '8px 15px'}
  });
  return legendPanel;
}

//// Discrete legends for Burned Area dates /-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/
function funcMakeRow(){
  var makeRow = function(color, name) {
    var colorBox = ui.Label({
      style: {color: '#ffffff',
        backgroundColor: color.getInfo(), //???
        padding: '10px',
        margin: '0 0 4px 0',
      }
    });
    var description = ui.Label({
      value: name.getInfo(), // :o
      style: {
        margin: '0px 0 4px 6px',
      }
    }); 
    return ui.Panel({
      widgets: [colorBox, description],
      layout: ui.Panel.Layout.Flow('horizontal')
    })};
  return makeRow;
};

function funcTitle(){
  var title = ui.Label({
    value: 'Day of the month',
    style: {fontWeight: 'bold',
      fontSize: '16px',
      margin: '0px 0 4px 0px'}});
  return title;
};

function createDiscreteLegendL10(listLegends, listPalette){
  var legend = ui.Panel({style: {position: 'bottom-right', padding: '8px 15px'}});
  var title = funcTitle();
  var makeRow = funcMakeRow();
  
  legend.add(title);
  
  for (var i = 1; i <= 9; i++) {
    var legendDays = listLegends.getNumber(i-1).format('%01d')
      .cat('-')
      .cat(listLegends.getNumber(i).format('%01d'));
    legend.add(makeRow(ee.String(listPalette.get(i-1)), legendDays));
  }
  Map.add(legend);
}
  
function createDiscreteLegendL11(listLegends, listPalette){
  var legend = ui.Panel({style: {position: 'bottom-right', padding: '8px 15px'}});
  var title = funcTitle();
  var makeRow = funcMakeRow();
  
  legend.add(title);
  
  for (var i = 1; i <= 10; i++) {
    var legendDays = listLegends.getNumber(i-1).format('%01d')
      .cat('-')
      .cat(listLegends.getNumber(i).format('%01d'));
    legend.add(makeRow(ee.String(listPalette.get(i-1)), legendDays));
  }
  Map.add(legend);
}

//// Total days of the month /-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-
function getDayOfYearStart(year, month) {
  var date= ee.Date.fromYMD(ee.Number.parse(year), ee.Number.parse(month), 1);
  var dayOfYear = date.getRelative('day', 'year');
  return dayOfYear;
};

function getDayOfYearEnd(year, month) {
  var date= ee.Date.fromYMD(ee.Number.parse(year), ee.Number.parse(month), 1);
  if (month==='12'){
    var endDate = date.advance(30, 'days');
  }else{
    var endDate = date.advance(1, 'month');
  }
  var dayOfYear = endDate.getRelative('day', 'year');
  return dayOfYear;
};

function getListDaysMonth(year, month){
  var startDayOfYear = getDayOfYearStart(year, month);
  var endDayOfYear = getDayOfYearEnd(year, month);
  var dateSubst = ee.Number(endDayOfYear).subtract(ee.Number(startDayOfYear));
  var dateDivd = dateSubst.divide(10).round();
  var sequenceList = ee.List.sequence(1, dateSubst, ee.Number(dateDivd));
  return sequenceList;
};


// NDVI, NDWI & BA data processing  -----------------------------------------------------------
function loadLayersCharts(yearSelector, monthSelector) {
  //// Load data by band
  var dataNDWI = modisNDWI.select('NDWI');
  var dataNDVI = modisNDVI.select('NDVI');
  var dataMBA = modisBurnedArea.select('BurnDate');
  
  //// Time range of analysis
  var year = yearSelector.getValue();
  var month = monthSelector.getValue();
  
  var startDate = ee.Date.fromYMD(
    ee.Number.parse(year), ee.Number.parse(month), 1);
  var endDate = startDate.advance(1, 'month');
  
  //// NDWI layer
  var filteredNDWI = dataNDWI.filter(ee.Filter.date(startDate, endDate));

  var percenNDWI = filteredNDWI.median().reduceRegion({
    reducer: ee.Reducer.percentile([15, 85]),
    geometry: deltaParana.geometry(),
    scale: 463.313,
  });
  
  var minNDWI = ee.Number(percenNDWI.get('NDWI_p15')).format('%.2f');
  var maxNDWI = ee.Number(percenNDWI.get('NDWI_p85')).format('%.2f');
  
  var minNDWIgI = minNDWI.getInfo();
  var maxNDWIgI = maxNDWI.getInfo();
  
  var paletteNDWI = ['#f1eef6','#bdc9e1','#74a9cf','#2b8cbe','#045a8d'];
  
  if (maxNDWIgI>0){
    var colorizedVisNDWI = {
      min: minNDWIgI,
      max: maxNDWIgI,
      palette: ['#f1eef6','#bdc9e1','#74a9cf','#2b8cbe','#045a8d'],
    };
    var colorBarNDWI = createColorBar('NDWI Values', paletteNDWI, minNDWIgI, maxNDWIgI);
  }else{
    var colorizedVisNDWI = {
      min: minNDWIgI,
      max: 0.1,
      palette: ['#f1eef6','#bdc9e1','#74a9cf','#2b8cbe','#045a8d'],
    };
    var colorBarNDWI = createColorBar('NDWI Values', paletteNDWI, minNDWIgI, 0.1);
  };
  
  var layerNDWI = 'NDWI '+year+'-'+month;
  Map.addLayer(filteredNDWI.median().clip(deltaParana.geometry()), colorizedVisNDWI, layerNDWI);
  Map.add(colorBarNDWI);
  
  //// Create histogram for NDWI
  var titleNDWIhist = 'NDWI Histogram '+year+'-'+month;
  
  var hist01 = ui.Chart.image.histogram({
  image: filteredNDWI.median(),
  region: deltaParana.geometry(),
  scale: 500,
  }).setOptions({
  title: titleNDWIhist,
  titleTextStyle: { fontSize: 14, bold: true, textAlign: 'center' },
  vAxis: { title: 'Pixel count' },
  hAxis: { title: 'NDWI value' },
  bar: { width: 3},  // Set the width of bars to 1 to avoid gaps
  legend: { position: 'none' },
  colors: ['#045a8d'],
  });
 
  //// NDVI layer
  var filteredNDVI = dataNDVI.filter(ee.Filter.date(startDate, endDate));
  
  var percenNDVI = filteredNDVI.median().reduceRegion({
    reducer: ee.Reducer.percentile([15, 85]),
    geometry: deltaParana.geometry(),
    scale: 800,
  });

  var minNDVI = ee.Number(percenNDVI.get('NDVI_p15')).format('%.2f');
  var maxNDVI = ee.Number(percenNDVI.get('NDVI_p85')).format('%.2f');
  
  var minNDVIgI = minNDVI.getInfo();
  var maxNDVIgI = maxNDVI.getInfo();
  
  var palette = ['#ffff62','#b2e2e2','#66c2a4','#2ca25f','#006d2c'];
  
  if (maxNDVIgI>0){
    var colorizedVisNDVI = {
      min: minNDVIgI,
      max: maxNDVIgI,
      palette: ['#ffff62','#b2e2e2','#66c2a4','#2ca25f','#006d2c'],
    };
    var colorBarNDVI = createColorBar('NDVI Values', palette, minNDVIgI, maxNDVIgI);
  }else{
    var colorizedVisNDVI = {
      min: minNDVIgI,
      max: 0.1,
      palette: ['#ffff62','#b2e2e2','#66c2a4','#2ca25f','#006d2c'],
    };
    var colorBarNDVI = createColorBar('NDVI Values', palette, minNDVIgI, 0.1);
  };
  
  var layerNDVI = 'NDVI '+year+'-'+month;
  Map.addLayer(filteredNDVI.median().clip(deltaParana.geometry()), colorizedVisNDVI, layerNDVI);
  Map.add(colorBarNDVI);

  //// Create histogram for NDVI
  var titleNDWVIhist = 'NDVI Histogram '+year+'-'+month;
  
  var hist02 = ui.Chart.image.histogram({
  image: filteredNDVI.median(),
  region: deltaParana.geometry(),
  scale: 500,
  }).setOptions({
  title: titleNDWVIhist,
  titleTextStyle: { fontSize: 14, bold: true, textAlign: 'center' },
  vAxis: { title: 'Pixel count' },
  hAxis: { title: 'NDVI value' },
  bar: { width: 3},
  legend: { position: 'none' },
  colors: ['#99d594'],
  });

  //// Burned area layer
  var filteredMBA = dataMBA.filter(ee.Filter.date(startDate, endDate));
  
  var minMaxMBA = filteredMBA.sum().reduceRegion({
    reducer: ee.Reducer.minMax(),
    geometry: deltaParana.geometry(),
    scale: 500,
  });
  
  //// Discretized legends
  var listLegends = getListDaysMonth(year, month);
  
  if (listLegends.length().getInfo()===11){
    var listPalette = ['#67000d', '#a50f15', '#cb181d', '#ef3b2c', '#fcc5c0','#fa9fb5',
  '#f768a1','#dd3497','#ae017e','#7a0177'];
    createDiscreteLegendL11(listLegends, ee.List(listPalette));
  }else{
    var listPalette = ['#67000d', '#a50f15', '#cb181d', '#ef3b2c', '#fcc5c0','#fa9fb5',
  '#f768a1','#dd3497','#ae017e'];
    createDiscreteLegendL10(listLegends, ee.List(listPalette));
  };
  
  //// Adding discretized BA layer
  var minMBA = ee.Number(minMaxMBA.get('BurnDate_min'));
  var maxMBA = ee.Number(minMaxMBA.get('BurnDate_max'));
  
    var colorizedVisMBA = {
    min: minMBA.getInfo(),
    max: maxMBA.getInfo(),
    palette: listPalette,
  };
  
  var layerMBA = 'Modis Burned Area '+year+'-'+month;
  Map.addLayer(filteredMBA.sum().clip(deltaParana.geometry()), colorizedVisMBA, layerMBA);
  
  //// Inserting NDVI & NDWI histograms in the main panel
  histResultsPanel.add(hist02);
  histResultsPanel.add(hist01);
  };      

// Load layers & charts button ---------------------------------------------------------------
function llcButton(){
  loadLayersCharts(yearSelector, monthSelector);
}

buttonLoad.onClick(llcButton);

// Reset button ------------------------------------------------------------------------------
var reset = function(){
  Map.clear();
  Map.addLayer(deltaParana.style(polygonStyle), {}, 'Paraná Delta boundaries');
  Map.centerObject(deltaParana, 7.8);
  
  function removeHistogramFromPanel() {
  //// Loop through the widgets in the main panel
    var widgets = histResultsPanel.widgets();
    for (var i = 0; i < widgets.length(); i++) {
      //// Check if the widget is a chart (histogram)
      if (widgets.get(i) instanceof ui.Chart) {
        //// If it is, remove it from the main panel
        histResultsPanel.remove(widgets.get(i));
      }
    }
  }
  removeHistogramFromPanel();
  removeHistogramFromPanel();
};

buttonRes.onClick(reset);