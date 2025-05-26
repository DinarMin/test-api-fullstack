import express from "express";
import cors from "cors";
import { Request, Response } from "express";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const VARIABLES = Array.from({ length: 1_000_000 }, (_, i) => ({
  id: i + 1,
  name: `Variable ${i + 1}`,
}));
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

  const selectedSet = selectedVariables;

  const sortedSelected = sortedOrder
    .filter((id) => selectedSet.has(id))
    .map((id) => filtered.find((item) => item.id === id))
    .filter(Boolean) as typeof VARIABLES;

  const unsortedSelected = Array.from(selectedSet)
    .filter((id) => !sortedOrder.includes(id))
    .map((id) => filtered.find((item) => item.id === id))
    .filter(Boolean) as typeof VARIABLES;

  const selectedIds = new Set([
    ...sortedOrder.filter((id) => selectedSet.has(id)),
    ...unsortedSelected.map((v) => v.id),
  ]);
  const rest = filtered.filter((item) => !selectedIds.has(item.id));

  filtered = [...sortedSelected, ...unsortedSelected, ...rest];

  const result = filtered.slice(step, step + lim).map((v) => ({
    ...v,
    selected: selectedSet.has(v.id),
  }));

  // if (sortedOrder.length) {
  //   const orderSet = new Set(sortedOrder);
  //   const sort = sortedOrder
  //     .map((id) => filtered.find((item) => item.id === id))
  //     .filter(Boolean) as typeof VARIABLES;
  //   const rest = filtered.filter((item) => !orderSet.has(item.id));
  //   filtered = [...sort, ...rest];
  // }

  // const result = filtered.slice(step, step + lim).map((v) => ({
  //   ...v,
  //   selected: selectedVariables.has(v.id),
  // }));
  // console.log(result);
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
