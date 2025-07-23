import requests
import random
import time
from typing import List, Dict

import yaml

BACKEND_URL = "http://localhost:8000"
EXP_ID = f"test-exp-{random.randint(1000, 9999)}"

NUM_CLIENTS = 8
CLIENTS_PER_EDGE = 4
ROUNDS = 10

clients = [f"Client-{i}" for i in range(NUM_CLIENTS)]

edges = [f"Edge-{i}" for i in range(NUM_CLIENTS // CLIENTS_PER_EDGE)]


def simulate_client_update(round_num: int, client_id: str) -> Dict:
    base = 0.3 + 0.075 * round_num
    acc = round(random.uniform(base, base + 0.05), 4)
    loss = round(1 - acc + random.uniform(0.01, 0.02), 4)
    return {"device": client_id, "round": round_num, "accuracy": acc, "loss": loss}


def average_metrics(metrics: List[Dict]) -> Dict:
    if not metrics:
        return {}
    avg_acc = sum(m["accuracy"] for m in metrics) / len(metrics)
    avg_loss = sum(m["loss"] for m in metrics) / len(metrics)
    return {"accuracy": round(avg_acc, 4), "loss": round(avg_loss, 4)}


def post(role: str, payload: Dict):
    url = f"{BACKEND_URL}/experiment/{EXP_ID}/log/{role}"
    try:
        res = requests.post(url, json=payload)
        if res.status_code != 200:
            print(f"Error posting to {url}: {res.text}")
    except Exception as e:
        print(f"Failed to post to {role}: {e}")


def create_experiment():
    url = f"{BACKEND_URL}/experiment/{EXP_ID}/create"
    metadata = {
        "num_clients": NUM_CLIENTS,
        "rounds": ROUNDS,
        "averaging algorithm": "FedAvg",
        "model": "lenet",
        "dataset": "mnist",
    }
    try:
        res = requests.post(url, json=metadata)
        if res.status_code != 200:
            print(f"Failed to create experiment: {res.text}")
    except Exception as e:
        print(f"Failed to create experiment: {e}")

    for client in clients:
        dist = {
            "trainloader": {
                "label_distribution": {
                    "4": 1143,
                    "1": 1349,
                    "8": 1161,
                    "0": 1201,
                    "6": 1171,
                    "2": 1197,
                    "3": 1296,
                    "7": 1232,
                    "9": 1164,
                    "5": 1086,
                },
                "num_items": 12000,
            },
            "valloader": {
                "label_distribution": {
                    "0": 303,
                    "1": 360,
                    "2": 293,
                    "8": 275,
                    "4": 304,
                    "7": 300,
                    "5": 260,
                    "3": 305,
                    "6": 305,
                    "9": 295,
                },
                "num_items": 3000,
            },
            "testloader": {
                "label_distribution": {
                    "5": 892,
                    "1": 1135,
                    "4": 982,
                    "6": 958,
                    "9": 1009,
                    "0": 980,
                    "8": 974,
                    "7": 1028,
                    "3": 1010,
                    "2": 1032,
                },
                "num_items": 10000,
            },
        }
        url = f"{BACKEND_URL}/experiment/{EXP_ID}/distribution/client"

        try:
            res = requests.post(url, json={"device": client, "distribution": dist})
            if res.status_code != 200:
                print(f"Error posting distribution for {client}: {res.text}")
        except Exception as e:
            print(f"Failed to post distribution for {client}: {e}")

    url = f"{BACKEND_URL}/experiment/{EXP_ID}/topology"
    with open("topo.yml", "r") as f:
        topology = yaml.safe_load(f)

    try:
        res = requests.post(url, json=topology)
        if res.status_code != 200:
            print(f"Error setting topology: {res.text}")
    except Exception as e:
        print(f"Failed to set topology: {e}")


def simulate_hfl():
    create_experiment()

    for round_num in range(1, ROUNDS + 1):
        print(f"\n--- Round {round_num} ---")

        # Step 1: Clients send updates
        edge_buckets = {edge: [] for edge in edges}

        for i, client in enumerate(clients):
            edge = edges[i // CLIENTS_PER_EDGE]
            payload = simulate_client_update(round_num, client)
            edge_buckets[edge].append(payload)
            post("client", payload)
            time.sleep(0.1)

        # Step 2: Edge servers aggregate
        central_bucket = []
        for edge, client_metrics in edge_buckets.items():
            agg = average_metrics(client_metrics)
            payload = {"device": edge, "round": round_num, **agg}
            post("edge", payload)
            central_bucket.append(payload)
            time.sleep(0.1)

        # Step 3: Central server aggregates
        central_agg = average_metrics(central_bucket)
        payload = {"device": "Central", "round": round_num, **central_agg}
        post("central", payload)
        time.sleep(0.1)


if __name__ == "__main__":
    simulate_hfl()
