import Globe from "globe.gl";
import * as THREE from "three";
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let PLANE_SCALE = 4;

const jinja_data = JSON.parse(
    document.getElementById("jinja-data").textContent
);

async function getFlightInfo(){
    let flight_info_json = await fetch(jinja_data["flight_info_route"])
    .then(response => response.json());
    return flight_info_json;
}

//y is north pole,
//z comes out prime meridian at equator
//x is y cross z
let globe = new Globe(document.getElementById('globe'));
globe.globeImageUrl("/static/earth-blue-marble.jpg")

function headingToRotationRad(heading){
    //0 is 90
    //90 is 0
    //180 is -90
    //270 is 180
    return (90 - heading) * THREE.MathUtils.DEG2RAD;

}


function sanitizeHeading(heading){
    return ((heading % 360) + 360) % 360;
}

async function updateGui() {
    let plane_data = await getFlightInfo();
    document.getElementById("hud-altitude").innerText = `${plane_data["altitude"]} feet`;
    document.getElementById("hud-airspeed").innerText = `${plane_data["airspeed"]} mph`;
    document.getElementById("hud-groundspeed").innerText = `${plane_data["groundspeed"]} mph`;
    document.getElementById("hud-heading").innerText = `${sanitizeHeading(plane_data["heading"])}°`;

    globe.customLayerData([plane_data]);
}


/**
 * globe.gl rotation matrix from a heading and a position
 * For the plane model, Z is forward and Y is up
 * 
 * @param {number} heading
 * @param {THREE.Vector3} position 
 */
function headingToRotMatrix(heading, position){
    let local_up = position.clone().normalize();

    let north_ref = new THREE.Vector3(0,1,0);
    
    let local_east = north_ref.clone().cross(local_up);
    let local_north = local_up.clone().cross(local_east);

    let rotation_rad = headingToRotationRad(heading);

    let east_component =  local_east.clone().multiplyScalar(Math.cos(rotation_rad))
    let north_component = local_north.clone().multiplyScalar(Math.sin(rotation_rad));
    let look_direction = east_component.clone().add(north_component);

    let z = look_direction.clone();
    let y = local_up.clone();
    let x = y.clone().cross(z);
    
    return new THREE.Matrix3(
        x.x, y.x, z.x,
        x.y, y.y, z.y,
        x.z, y.z, z.z
    )
}


const loader = new GLTFLoader();
loader.load("/static/plane/plane.gltf", function(gltf){
    let plane_model = gltf.scene;
    plane_model.scale.setScalar(PLANE_SCALE);
    globe.customThreeObject(() => {
        return plane_model.clone();
    });
    globe.customThreeObjectUpdate(
        (obj, data) => {  
            Object.assign(obj.position, globe.getCoords(data["latitude"], data["longitude"], 0.1));
                            
            let rot = headingToRotMatrix(data["heading"], obj.position.clone());
            let rot4 = new THREE.Matrix4().setFromMatrix3(rot);

            obj.setRotationFromMatrix(rot4);
        }
    );
    updateGui();
    getFlightInfo().then( (result) => {
        globe.pointOfView({"lat": result["latitude"], "lng": result["longitude"], altitude: 1.5}, 3000);
    })
    
    setInterval(updateGui, 5000);
});
