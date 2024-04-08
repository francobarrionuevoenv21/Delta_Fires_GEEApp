# Paraná Delta Burned Area App

![image](https://github.com/francobarrionuevoenv21/Delta_Fires_GEEApp/assets/78272951/b0854d5c-d834-4542-9039-074d43ffb135)

## About the repository

This repository contains the main code to run the Paraná Delta Burned Area App in the Google Earth Engine environment. All the code was written using the JavaScript GEE API. 

## About the app

The Paraná Delta Burned Area App allows users to easily visualize the burned area and its temporal and spatial distribution along the Paraná River Delta, Argentina, during the period 2001-2022. It also provide valuable insights about vegetation conditions and humidity 
through the NDVI and NDWI index, respectively. These parameters provide meaningful information for fire risk assessment. All the products used in this app correspond to MODIS derived products.

🌎 [Link to the app](https://fbarrionuevo.users.earthengine.app/view/paran-delta-indices--burned-area)

## How can you use it for your study region?

1) Copy or download the code.
2) Enter GEE platform, create a new file and paste de code
3) In the following lines change the path of your study region vector file (a) and the time range of analysis (b)

(a)
```
var deltaParana = ee.FeatureCollection('projects/ee-my-francodbarr/assets/shpDelta');
//// Here you can load your own study region.
```
(b)

```
var startYear = '2001'; //// First year
var endYear = '2022'; //// Last year, including it
//// Lines aboves determines years that the user will be able to analyze
```

