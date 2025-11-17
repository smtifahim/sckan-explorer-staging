# This script assumes that the stardog server is running. The python code runs all the necessary 
# SPARQL queries for SCKAN NLI and saves the results in corresponing json files. 
# (version: 1.0; @Author: Fahim Imam)

import os
import stardog
import json
import requests
import sys

# Load environment variables from a .env file if python-dotenv is installed.
try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    # If python-dotenv is not installed, rely on existing environment variables.
    pass

# Stardog DB connection details using stardog cloud endpoint.
# Credentials are read from environment variables with sensible defaults.
username = os.getenv('SCKAN_USERNAME')
password = os.getenv('SCKAN_PASSWORD')

conn_details = {
    'endpoint': 'https://stardog.scicrunch.io:5821',
    'username': username,
    'password': password
}

db_name = 'SCKAN-NOV-2025'

# Quick connectivity pre-check to provide clearer error messages before using stardog client.
def precheck_endpoint(endpoint, timeout=10.0):
    health_url = endpoint.rstrip('/') + '/admin/alive'
    try:
        r = requests.get(health_url, timeout=timeout)
        if r.status_code == 200:
            print(f"Connectivity check: {health_url} reachable (200 OK)")
            return True
        else:
            print(f"Connectivity check: {health_url} returned status {r.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"Connectivity check failed: Unable to reach {health_url}: {e}")
        return False

# Allow user to override the short timeout via env var
try:
    precheck_timeout = float(os.getenv('STARDOG_TIMEOUT', '10'))
except Exception:
    precheck_timeout = 10.0


# File locations for the queries needed for SCKAN-NLI
query_files = [
                './sparql-queries/sckan-all-locations.rq',
                './sparql-queries/a-b-via-c.rq',
                './sparql-queries/axonal-path-partial-order.rq',
                './sparql-queries/neuron-metadata.rq',
                './sparql-queries/major-organs-synonyms.rq',
                './sparql-queries/species-synonyms.rq',
                './sparql-queries/senmot-organ-innervation.rq',
                './sparql-queries/major-nerves.rq',
                './sparql-queries/axonal-path-with-synapse.rq',
                './sparql-queries/organ-innervation-collapsed.rq',
                './sparql-queries/sckan-version-info.rq'
              ]

# File locations for the generated query results in json format
generated_files = [
                    './sckan-nli-data/sckan-all-locations.json',
                    './sckan-nli-data/a-b-via-c.json',
                    './sckan-nli-data/axonal-path.json',
                    './sckan-nli-data/neuron-metadata.json',
                    './sckan-nli-data/major-organs-synonyms.json',
                    './sckan-nli-data/species-synonyms.json',
                    '/sckan-nli/data/senmot-organ-innervation.rq',
                    './sckan-nli-data/major-nerves.json',
                    './sckan-nli-data/axonal-path-with-synapse.json',
                    './sckan-nli-data/organ-innervation-pathways-with-collapsed-nodes.json',
                    './sckan-nli-data/sckan-version.json'
                  ]

def checkServerStatus(admin):
    if (admin.healthcheck()):
        print ("        Server Status: Stardog server is running and able to accept traffic.")
    else:
        print ("        Server Status: Stardog server is NOT running. Please start the server and try again.")
        exit();
print ("\nProgram execution started...")

# Basic checks before connecting
if not username or not password:
    print("ERROR: Stardog credentials not set. Please set SCKAN_USERNAME and SCKAN_PASSWORD environment variables.")
    sys.exit(1)

print("Running connectivity pre-check to Stardog endpoint...")
ok = precheck_endpoint(conn_details['endpoint'], timeout=precheck_timeout)
if not ok:
    print("Unable to reach the Stardog endpoint. Possible causes:\n  - Network connectivity or VPN issues\n  - Hostname or port is blocked by firewall\n  - Stardog service is down")
    print(f"Try: curl -v {conn_details['endpoint'].rstrip('/') + '/admin/alive'}")
    sys.exit(1)

try:
    with stardog.Admin(**conn_details) as admin:  
        print ("\nStep 0: Checking Stardog server status..")
        checkServerStatus(admin)
        print ("Step 0: Done!")
except Exception as e:
    print(f"Failed to create Stardog Admin client: {e}")
    print("If this is a network timeout, verify the endpoint and network reachability.")
    sys.exit(1)

try:
    with stardog.Connection(db_name, **conn_details) as conn: 
        for i, query_file in enumerate (query_files):
            print ("\nStep " + str(i+1) + ": Executing query from: " + query_file)
            with open(query_file, 'r') as file:
                query = file.read()
                result = conn.select(query, reasoning=False)
            print ("        Saving query results...")
            with open(generated_files[i], 'w') as file:
                json.dump(result, file, indent=2)
            print ("        Query results saved to: " + generated_files[i])
            print ("Step " + str(i+1) + ": Done!")
        conn.close()
    print ("\nAll queries executed and results are saved successfully!\n")
except Exception as e:
    print(f"Failed to open Stardog connection or run queries: {e}")
    print("Check network connectivity, credentials, and that the database name is correct.")
    sys.exit(1)
