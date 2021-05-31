[![License](https://img.shields.io/badge/License-Apache%202.0-brightgreen.svg)](http://www.apache.org/licenses/LICENSE-2.0.html)


[![Englsh](https://img.shields.io/badge/language-English-orange.svg)](#english)

# <a name="english"></a>mago3DJS
Open source JavaScript library for 3D multi-block visualization

Generation 3D GIS platform that integrates and visualizes AEC (Architecture, Engineering, Construction) areas and traditional 3D spatial information (3D GIS). Integrate AEC and 3D GIS in a web browser, indoors, outdoors, indistinguishable. You can browse and collaborate on large-scale BIM (Building Information Modeling), JT (Jupiter Tessellation), and 3D GIS files without installing any programs on the web browser.

# Characteristic
- Integration of AEC and 3D GIS
- Seamless connection of indoor and outdoor spaces
- Runs on a web browser and does not require a separate plug-in or ActiveX installation
- It is developed based on open source (Cesium, Web World Wind) and has excellent openness and scalability
- Efficient management and ultra-fast rendering of high-capacity 3-D files

# Supported Format Formats

- IFC(Industry Foundation Classes)
- JT(Jupiter Tessellation)
- OBJ
- 3DS
- COLLADA

# Application example
- Antarctic Science Base Web-based 3D facility, equipment management system
- LiveDroneMap


# Getting Started ###
### 1. Development Environment
 - [java8](http://www.oracle.com/technetwork/java/javase/downloads/index.html ) &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&nbsp;&nbsp;&nbsp;&nbsp; ● [Jasmine](https://github.com/mali151298/mago3djs/wiki/Test)
 - [eclipse neon(need)](https://www.eclipse.org/downloads/eclipse-packages/)
 &emsp;&emsp;&emsp;&emsp;&emsp; ● [Jsdoc](https://github.com/mali151298/mago3djs/wiki/Documentation)
 - [node](https://nodejs.org/ko/download/) &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&nbsp;&nbsp;&nbsp;&nbsp; ● [Gulp](https://github.com/mali151298/mago3djs/wiki/Build)
 - [apache 2.4.25 Win64](https://www.apachelounge.com/download/)&emsp;&emsp;&emsp;&emsp;&nbsp;&nbsp; ● [eslint](https://github.com/mali151298/mago3djs/wiki/%EC%A0%95%EC%A0%81%EA%B2%80%EC%82%AC)
 - [server settings](https://github.com/mali151298/mago3djs/wiki/%EC%9B%B9%EC%84%9C%EB%B2%84-%EC%84%A4%EC%A0%95) &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp; ● [JQuery](https://github.com/mali151298/mago3djs/wiki/Third-Party)
 - [Cesium-Custermizing](https://github.com/mali151298/mago3djs/wiki/Cesium-Custermizing)

### 2. Source Download
- Use git to install the source to C:\git\repository\mago3djs with git clone https://github.com/mali151298/mago3djs.git. <br>
- Run eclipse and import mago3djs into <code> Project Import File -> import -> General -> Projects from Folder or Archive</code>.
- If you are not using git, click the Download ZIP link to install it.


### 3. Node Install ###
- [node](https://nodejs.org/ko/download/) to install Window Install (.msi) 64-bit.
- After the installation is complete, go to the C:\git\repository\mago3djs directory.
- gulp installs globally in Terminal to use the module's mockups.<pre><code>C:\git\repository\mago3djs> npm install -g gulp</code></pre>

### 4. F4D Converter Install
- [www.mago3d.com](http://www.mago3d.com/homepage/download.do) 에 접속
- Installer : F4D Converter 64bit (this installation requires Windows 7 or later) 설치
- Install Path: C:\F4DConverter\ 

### 5. Data Conversion
- Create a directory to store the changed f4d(outputFolder) <br>
<code>C:\f4d\projectname (Create a directory for each project under the data folder, the root folder)</code>
- Save the data to be converted to C:\demo_data(inputFolder)
- Run Command Line Prompt (cmd.exe) as an administrator and move to the directory where F4D Converter is installed
- Run
<br>※ For a description of F4D Conveter argument[F4D Conveter](https://github.com/mali151298/F4DConverter)<pre><code>C:\F4DConverter>F4DConverter.exe #inputFolder C:\demo_f4d #outputFolder C:\f4d\projectname #log C:\demo_f4d/logTest.txt #indexing y</code></pre>
- Create Symbolic Link to use transformed F4D files as web service in mago3D JS project
  - Run Command Line Prompt (cmd.exe) with administrative privileges and go to mago3D JS project<br>
  <code>C:\mago3djs</code><br>
  <pre><code>C:\mago3djs>mklink /d "C:\git\repository\mago3djs\f4d" "C:\f4d" 
  (delete is rmdir data)</code></pre>

### 6. Edit Configuration File
Add two configuration files. (data.json, policy.json)
#### data.json
- It is divided into three major areas. Attributes to store attribute values, children to store child node information, other area to store location information
- The isPhysical attribute of the - attributes field is a mandatory attribute
- The data_key of the root node of json matches the project name under the f4d folder
<pre><code>{
    //attributes area
    "attributes" : {
      "isPhysical" : false,
      "nodeType": "root",
      "projectType": "project Type"
    },
    //Child node area
    "children" : [
    ],
    //Location information area
    "data_key" : "Project name",
    "data_name" : "Project name"
}</code></pre>
- <code>C:\f4d\projectname</code>to find the directory to render
- The characters after F4D_ in the directory name are unique identifiers
- Modify the data_key value of children from the data.json file to a unique identifier
- Modify latitude, longitude, height, heading, pitch, and roll values to appropriate values
<pre><code>//Child node area
"children" : [
   {
     "attributes" : {
       "isPhysical" : true,
       "nodeType" : "..."
     },
     "children" : [
     ],
     "data_key" : "Unique identifier",
     "data_name" : "Data name",
     "latitude" : Enter latitude,
     "longitude" : Enter longitude,
     "height" : Enter height,
     "heading" : Enter heading,
     "pitch" : Enter pitch,
     "roll" : Enter roll
  }
]
</code></pre>

#### policy.json
  - Project to be loaded at initialization, Init Camera Latitude, Longitude, CallBack Function, Geo Server setup
  - Enter key value to load when initializing page, <code> , </code> if you want to load multiple projects
  <pre><code>"geo_data_default_projects": [
    "data.json"
]</code></pre>

  - Fix location (lattiude, longitude) to move when web page starts
  <pre><code>"geo_init_latitude": "Enter latitude",
"geo_init_longitude": "Enter longitude"</code></pre>

  - Cesium ion Terrain access token setting
    - When downloading the maago3D JS source, the default is to use the Cesium World Terrain.
    - Issued Cesium ion token for cesium terrain application in mago3D JS. (https://cesium.com/ion/signin)
  <pre><code> "geo_cesium_ion_token": "cesium ion token" </code></pre>

### 7. Running Node Server
<pre><code>// If you run the server privately
C:\git\repository\mago3djs>node server.js
// If you run the server as public
C:\git\repository\mago3djs>node server.js --public true
</code></pre>

### 8. Browser verification
<pre><code>// Cesium
http:localhost/sample/cesium.html
// WorlWind
http:localhost/sample/worldwind.html</code></pre>

## LICENSE ##
[Apache License Version 2.0](http://www.apache.org/licenses/LICENSE-2.0.html).


<br><br>
