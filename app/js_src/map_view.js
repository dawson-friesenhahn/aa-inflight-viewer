import Globe from "globe.gl";
import * as THREE from "three";
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const jinja_data = JSON.parse(
    document.getElementById("jinja-data").textContent
);


let plane_model = null;
let plane_data = [await getFlightInfo()];


const loader = new GLTFLoader();
loader.load("/static/plane/plane.gltf", function(gltf){
    plane_model = gltf.scene;
    plane_model.scale.setScalar(4);
    
});

let globe = new Globe(document.getElementById('globe'));
globe.globeImageUrl("/static/earth-blue-marble.jpg")
globe.customLayerData(plane_data);
globe.customThreeObject( () => { return plane_model ? plane_model.clone() : new THREE.Object3D();});
globe.customThreeObjectUpdate((obj, data) => {
    if (data){
        Object.assign(obj.position, globe.getCoords(data["latitude"], data["longitude"], 0.1));
        
        console.log("setting...");
    } 
    });

async function getFlightInfo(){
    let flight_info_json = await fetch(jinja_data["flight_info_route"])
    .then(response => response.json());
    return flight_info_json;
}




async function updateGui() {
    plane_data = [await getFlightInfo()];
    console.log(plane_data);
    globe.customLayerData(plane_data);
}

setInterval(updateGui, 5000);