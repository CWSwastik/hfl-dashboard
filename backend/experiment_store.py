import csv
import os
import time
from typing import Dict, List
from collections import defaultdict
from datetime import datetime


class ExperimentStore:
    def __init__(self):
        # {exp_id -> ExperimentData}
        self.experiments: Dict[str, Dict] = {}

    def create_experiment(self, exp_id: str, metadata: dict):
        if exp_id in self.experiments:
            raise ValueError(f"Experiment {exp_id} already exists")
        self.experiments[exp_id] = {
            "metadata": metadata,
            "distributions": defaultdict(dict),  # role -> device -> dist
            "metrics": defaultdict(
                lambda: defaultdict(list)
            ),  # role -> device -> list of metrics
        }

    def add_distribution(self, exp_id: str, role: str, device: str, distribution: dict):
        self._check_exp(exp_id)
        self.experiments[exp_id]["distributions"][role][device] = distribution

    def add_metric(self, exp_id: str, role: str, device: str, metric: dict):
        self._check_exp(exp_id)
        metric["timestamp"] = time.time()
        self.experiments[exp_id]["metrics"][role][device].append(metric)

    def get_all_metrics(self, exp_id: str):
        self._check_exp(exp_id)
        return self.experiments[exp_id]["metrics"]

    def get_metadata(self, exp_id: str):
        self._check_exp(exp_id)
        return self.experiments[exp_id]["metadata"]

    def get_distributions(self, exp_id: str):
        self._check_exp(exp_id)
        return self.experiments[exp_id]["distributions"]

    def list_experiments(self):
        return list(self.experiments.keys())

    def log_to_csv(self, exp_id: str, folder="logs"):
        self._check_exp(exp_id)
        os.makedirs(folder, exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        meta_file = os.path.join(folder, f"{exp_id}_meta_{timestamp}.csv")
        metrics_file = os.path.join(folder, f"{exp_id}_metrics_{timestamp}.csv")
        dist_file = os.path.join(folder, f"{exp_id}_dist_{timestamp}.csv")

        # Log metadata
        with open(meta_file, "w", newline="") as f:
            writer = csv.writer(f)
            for k, v in self.experiments[exp_id]["metadata"].items():
                writer.writerow([k, v])

        # Log distributions
        with open(dist_file, "w", newline="") as f:
            writer = csv.writer(f)
            writer.writerow(["role", "device", "loader", "label", "count"])
            for role, devs in self.experiments[exp_id]["distributions"].items():
                for device, loaders in devs.items():
                    for loader_name, loader_data in loaders.items():
                        for label, count in loader_data["label_distribution"].items():
                            writer.writerow([role, device, loader_name, label, count])

        # Log metrics
        with open(metrics_file, "w", newline="") as f:
            writer = csv.writer(f)
            writer.writerow(
                ["role", "device", "round", "accuracy", "loss", "timestamp"]
            )
            for role, devs in self.experiments[exp_id]["metrics"].items():
                for device, metrics in devs.items():
                    for m in metrics:
                        writer.writerow(
                            [
                                role,
                                device,
                                m["round"],
                                m["accuracy"],
                                m["loss"],
                                m["timestamp"],
                            ]
                        )

    def _check_exp(self, exp_id):
        if exp_id not in self.experiments:
            raise ValueError(f"Experiment {exp_id} not found")


# Usage
store = ExperimentStore()
