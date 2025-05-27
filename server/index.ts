import express from "express";
import cors from "cors";
import { Request, Response } from "express";
import fs from "fs";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

type Variable = {
  id: number;
  name: string;
};

const VARIABLES:Variable[] = JSON.parse(fs.readFileSync("variables.json", "utf-8"));

let selectedVariables = new Set<number>();
let sortedOrder: number[] = [];

app.get("/variables", (req: Request, res: Response) => {
  const { offset = 0, limit = 20, search = "" } = req.query;
  const step = parseInt(offset as string) || 0;
  const lim = parseInt(limit as string) || 20;
  const query = (search as string).toLowerCase();

let filtered = VARIABLES.filter((variable) =>
  variable.name.toLowerCase().includes(query)
);

const filteredMap = new Map(filtered.map((item) => [item.id, item]));
const orderedPart = sortedOrder
  .map((id) => filteredMap.get(id))
  .filter(Boolean) as typeof VARIABLES;

const remaining = filtered.filter((item) => !sortedOrder.includes(item.id));
filtered = [...orderedPart, ...remaining];

const selectedSet = selectedVariables;
const selected = filtered.filter((item) => selectedSet.has(item.id));
const unselected = filtered.filter((item) => !selectedSet.has(item.id));
filtered = [...selected, ...unselected];

const result = filtered.slice(step, step + lim).map((v) => ({
  ...v,
  selected: selectedSet.has(v.id),
}));

res.json(result);
});

app.post("/select", (req, res) => {
  const { id, selected } = req.body;
  if (selected) {
    selectedVariables.add(id);
  } else {
    selectedVariables.delete(id);
  }
  res.json({ success: true });
});

app.post("/sort", (req, res) => {
  const { ids } = req.body;
  sortedOrder = ids;
  res.json({ success: true });
});

app.get("/state", (req, res) => {
  res.json({
    selected: Array.from(selectedVariables),
    sorted: sortedOrder,
  });
});

app.post("/variables-by-ids", (req, res) => {
  const { ids } = req.body;
  const result = VARIABLES.filter((item) => ids.includes(item.id));
  res.json(result);
});

app.post("/reset", (req, res) => {
  selectedVariables.clear();
  sortedOrder = [];
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`);
});
