import Globe from "globe.gl";
import * as THREE from "three";
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const jinja_data = JSON.parse(
    document.getElementById("jinja-data").textContent
);




let globe = new Globe(document.getElementById('globe'));
globe.globeImageUrl("/static/earth-blue-marble.jpg")


async function updateGui() {
    let plane_data = [await getFlightInfo()];
    globe.customLayerData(plane_data);
}


const loader = new GLTFLoader();
loader.load("/static/plane/plane.gltf", function(gltf){
    let plane_model = gltf.scene;
    plane_model.scale.setScalar(4);
    globe.customThreeObject(() => {return plane_model.clone();});
    globe.customThreeObjectUpdate(
        (obj, data) => {
            if (! obj){
                console.log("no object...");
                return;
            }
            if (data){
                Object.assign(obj.position, globe.getCoords(data["latitude"], data["longitude"], 0.1));
    
                console.log("setting...");
            } 
        }
    );


    setInterval(updateGui, 5000);
});



async function getFlightInfo(){
    let flight_info_json = await fetch(jinja_data["flight_info_route"])
    .then(response => response.json());
    return flight_info_json;
}






