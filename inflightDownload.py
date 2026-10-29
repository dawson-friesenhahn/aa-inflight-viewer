import requests
from datetime import datetime
import os
from time import sleep
import json

output_dir = os.path.join(os.path.dirname(__file__), "example_json", "ABQ-DFW")

num_downloaded = 0
while True:

    # flight_info = requests.get("https://www.aainflight.com/api/v1/connectivity/viasat/flight").json()
    # service_info = requests.get("https://www.aainflight.com/api/v1/connectivity/viasat/services").json()

    system_status = requests.get("https://www.aainflight.com/api/v1/connectivity/intelsat/system-status").json()

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    with open(os.path.join(output_dir, f"{timestamp}.json"), "w") as f:
        json.dump(system_status, f, indent=2)

    
    
    num_downloaded += 1
    print(num_downloaded)
    
    sleep(30)