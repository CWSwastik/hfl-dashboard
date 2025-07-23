from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.middleware.cors import CORSMiddleware
from experiment_store import store
from typing import Literal

app = FastAPI()
clients = []

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    clients.append(websocket)
    try:
        while True:
            await websocket.receive_text()  # keep alive
    except WebSocketDisconnect:
        clients.remove(websocket)


async def notify_frontend(msg):
    for client in clients:
        await client.send_json(msg)


# -------------------------
# Routes for Experiment API
# -------------------------


@app.post("/experiment/{exp_id}/create")
async def create_experiment(exp_id: str, request: Request):
    metadata = await request.json()
    try:
        store.create_experiment(exp_id, metadata)
        return {"status": "created", "exp_id": exp_id}
    except ValueError as e:
        return {"error": str(e)}


@app.post("/experiment/{exp_id}/topology")
async def set_topology(exp_id: str, request: Request):
    data = await request.json()

    try:
        store.set_topology(exp_id, data)
        return {"status": "ok"}
    except KeyError:
        return {"error": f"Experiment {exp_id} does not exist"}


@app.post("/experiment/{exp_id}/log/{role}")
async def log_metric(
    exp_id: str,
    role: Literal["client", "edge", "central"],
    request: Request,
):
    data = await request.json()
    device = data.get("device")
    if not device:
        return {"error": "Missing 'device'"}

    try:
        store.add_metric(exp_id, role, device, data)
    except ValueError as e:
        return {"error": str(e)}

    await notify_frontend({**data, "role": role, "exp_id": exp_id})
    return {"status": "ok"}


@app.post("/experiment/{exp_id}/distribution/{role}")
async def log_distribution(
    exp_id: str,
    role: Literal["client", "edge", "central"],
    request: Request,
):
    data = await request.json()
    device = data.get("device")
    dist = data.get("distribution")
    if not device or not dist:
        return {"error": "Missing 'device' or 'distribution'"}

    try:
        store.add_distribution(exp_id, role, device, dist)
        return {"status": "ok"}
    except ValueError as e:
        return {"error": str(e)}


@app.get("/experiment/{exp_id}/metrics")
def get_metrics(exp_id: str):
    try:
        return store.get_all_metrics(exp_id)
    except ValueError as e:
        return {"error": str(e)}


@app.get("/experiment/{exp_id}/meta")
def get_metadata(exp_id: str):
    try:
        return store.get_metadata(exp_id)
    except ValueError as e:
        return {"error": str(e)}


@app.get("/experiment/{exp_id}/topology")
def get_topology(exp_id: str):
    try:
        return store.get_topology(exp_id)
    except ValueError as e:
        return {"error": str(e)}


@app.get("/experiments")
def list_experiments():
    return store.list_experiments()


@app.post("/experiment/{exp_id}/log_to_csv")
def log_to_csv(exp_id: str):
    try:
        store.log_to_csv(exp_id)
        return {"status": "saved to csv"}
    except ValueError as e:
        return {"error": str(e)}
