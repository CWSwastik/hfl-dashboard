from collections import defaultdict
from typing import Dict, List


class MetricsStore:
    def __init__(self):
        # { role -> { device_id -> [metrics] } }
        self.data: Dict[str, Dict[str, List[dict]]] = {
            "client": defaultdict(list),
            "edge": defaultdict(list),
            "central": defaultdict(list),
        }

    def add_metric(self, role: str, device_id: str, metric: dict):
        self.data[role][device_id].append(metric)

    def get_all(self):
        return self.data

    def reset(self):
        self.data = {
            "client": defaultdict(list),
            "edge": defaultdict(list),
            "central": defaultdict(list),
        }


store = MetricsStore()
