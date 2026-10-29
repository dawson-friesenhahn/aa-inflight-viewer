import json
from typing import NamedTuple
import requests
from datetime import datetime, timezone, timedelta


class FlightInfo(NamedTuple):
    altitude_feet: int
    airspeed_mph: int
    groundspeed_mph: int
    heading_deg: int
    lat_deg: float
    long_deg: float
    origin_icao: str
    destination_icao: str
    raw_json_source: str


def get_flight_info() -> FlightInfo:

    # first, try viasat
    try:
        parsed_json: dict = requests.get(
            "https://www.aainflight.com/api/v1/connectivity/viasat/flight"
        ).json()
        if parsed_json.get("status") is None:
            timestamp = datetime.fromisoformat(
                parsed_json.get("timestamp")
            )  # (parsed_json.get("timestamp"), "%Y-%m-%dT%H:%M:%SZ").
            now = datetime.now(timezone.utc)
            if (now - timestamp) < timedelta(seconds=30):
                return viasat_to_flightinfo(parsed_json)
    except Exception as e:
        print(e)

    # Next, try intelsat
    try:
        parsed_json: dict = requests.get(
            "https://www.aainflight.com/api/v1/connectivity/intelsat/system-status"
        ).json()
        # TODO: add some check for what happens when not connected to an intelsat system
        return intelsat_to_flightinfo(parsed_json)
    except Exception as e:
        print(e)

    return fake_flightinfo()


def fake_flightinfo():
    print("FAKE FLIGHT INFO")


def viasat_to_flightinfo(viasat_json: dict):
    print("using viasat")
    return FlightInfo(
        altitude_feet=viasat_json["altitude"],
        airspeed_mph=viasat_json["airspeed"],
        groundspeed_mph=viasat_json["groundspeed"],
        heading_deg=viasat_json["heading"],
        lat_deg=viasat_json["latitude"],
        long_deg=viasat_json["longitude"],
        origin_icao=viasat_json["origin"],
        destination_icao=viasat_json["destination"],
        raw_json_source=json.dumps(viasat_json),
    )


def lat_long_pair_to_heading(
    loc1: tuple[float, float], loc2: tuple[float, float]
) -> float:
    # TODO: do math
    return 0


last_lat_long = None


def intelsat_to_flightinfo(intelsat_json: dict):
    print("using intelsat")
    global last_lat_long
    this_lat_deg = float(intelsat_json["positional_info"]["latitude"])
    this_long_deg = float(intelsat_json["positional_info"]["longitude"])

    if last_lat_long is None:
        heading = 0
        last_lat_long = (this_lat_deg, this_long_deg)
    else:
        heading = lat_long_pair_to_heading(last_lat_long, (this_lat_deg, this_long_deg))

    return FlightInfo(
        altitude_feet=int(
            float(intelsat_json["positional_info"]["above_gnd_level_feet"])
        ),
        airspeed_mph=int(
            float(intelsat_json["positional_info"]["horizontal_velocity_mph"])
        ),
        groundspeed_mph=int(
            float(intelsat_json["positional_info"]["horizontal_velocity_mph"])
        ),
        heading_deg=heading,
        lat_deg=this_lat_deg,
        long_deg=this_long_deg,
        origin_icao=intelsat_json["flight_info"]["departure_airport_icao"],
        destination_icao=intelsat_json["flight_info"]["arrival_airport_icao"],
        raw_json_source=json.dumps(intelsat_json),
    )


if __name__ == "__main__":
    print(get_flight_info())
