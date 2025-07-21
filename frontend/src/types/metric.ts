export interface Metric {
  round: number;
  accuracy: number;
  loss: number;
  device: string;
  role: "client" | "edge" | "central";
  exp_id: string;
}
