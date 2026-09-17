from flask import Flask, render_template, jsonify, url_for
import json

app = Flask(__name__, )


@app.route('/')
def index():
    return render_template("mapView.html", flight_info_route=url_for("fakeFlight"))

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


if __name__ == "__main__":
    app.run(debug=True)




