import Globe from "globe.gl";
import * as THREE from "three";
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { degToRad } from "three/src/math/MathUtils.js";

let PLANE_SCALE = 4;

function getMapMarkerHTML(textLabel){
    return `<div class="container btn-info">${textLabel}</div>`
}

const jinja_data = JSON.parse(
    document.getElementById("jinja-data").textContent
);

async function getFlightInfo(){
    let flight_info_resp= await fetch(jinja_data["flight_info_route"]);
    
    let flight_json = await flight_info_resp.json();
    return flight_json;
}

async function getAirportInfo(airport_code){
    
    let info = await fetch(`/airportInfo/${airport_code}`);
    
    info = await info.json();
    
    //do this so html elements get added properly to the globe
    info["lat"] = info["latitude"];
    info["lng"] = info["longitude"];

    return info;
}

let origin = null;
let destination = null;

//y is north pole,
//z comes out prime meridian at equator
//x is y cross z
let globe = new Globe(document.getElementById('globe'));
globe.globeImageUrl("/static/earth-blue-marble.jpg")
//globe.globeTileEngineUrl((x, y, l) => `https://tile.openstreetmap.org/${l}/${x}/${y}.png`);

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


function haversine(theta_rad){
    return Math.pow(Math.sin(theta_rad/2), 2);
}

function haversineDistance(lat1, lng1, lat2, lng2){
    let lat1Rad = degToRad(lat1);
    let lng1Rad = degToRad(lng1);
    let lat2Rad = degToRad(lat2);
    let lng2Rad = degToRad(lng2);

    return (
        haversine(lat2Rad-lat1Rad) 
        + Math.cos(lat1Rad)
        * Math.cos(lat2Rad)
        * haversine(lng2Rad-lng1Rad)
    )
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
    getFlightInfo().then( async (result) => {
        globe.pointOfView({"lat": result["latitude"], "lng": result["longitude"], altitude: 1.5}, 3000);
        
        origin = await getAirportInfo(result["origin"]);

        destination = await getAirportInfo(result["destination"]);
        
        globe.htmlElementsData([origin, destination])
        .htmlElement( d => {
            const el = document.createElement("div");
            el.innerHTML = getMapMarkerHTML(d["city"]);
            // el.style.color = "red";
            // el.style.width = "10px";
            el.style.transition = "opacity 250ms";


            el.style['pointer-events'] = 'auto';
            el.style.cursor = 'pointer';
            // el.style.transform = 'translate(-50%, -50%)'; 
            el.onclick = () => console.info(d);
            return el;
        })
        .htmlElementVisibilityModifier(
            (el, isVisible) => {
                el.style.opacity = isVisible ? 1 : 0;
            }
        )
         
    })
    
    setInterval(updateGui, 5000);
});
