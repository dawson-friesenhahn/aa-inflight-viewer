from flask import Flask, render_template, jsonify, url_for, request
import json
import requests

from airports import Airports
airports = Airports()


app = Flask(__name__, )


@app.route('/')
def index():
    return render_template("mapView.html", flight_info_route=url_for("realFlight"))

@app.route('/services')
def services():
    return render_template("services.html")

@app.route("/about")
def about():
    return render_template("about.html")

@app.route("/fakeFlight.json")
def fakeFlight():

    with open("example_json/flight.json", "r") as f:
        return jsonify(json.load(f))

@app.route("/fakeServices.json")
def fakeServices():
    with open("example_json/services.json", "r") as f:
        return jsonify(json.load(f))

@app.route("/airportInfo/<code>")
def airportInfo(code: str):
    try:
        airport = airports.find_by_icao_code(code)
        if airport:
            return jsonify(airport)
        raise LookupError
    except:
        return jsonify({"error": "Airport not found"}), 404

@app.route("/realFlight")
def realFlight():
    # Getting around blocking CORS... this is a pretty lame way to do this though.
    flight_info = requests.get("https://www.aainflight.com/api/v1/connectivity/viasat/flight").json()
    return jsonify(flight_info)


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)




