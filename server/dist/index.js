import express from "express";
import cors from "cors";
const app = express();
const PORT = 3000;
app.use(cors());
app.use(express.json());
const VARIABLES = Array.from({ length: 1000000 }, (_, i) => ({
    id: i + 1,
    name: `Variable ${i + 1}`,
}));
let selectedVariables = new Set();
let sortedOrder = [];
app.get("/variables", (req, res) => {
    const { offset = 0, limit = 20, search = "" } = req.query;
    const step = parseInt(offset) || 0;
    const lim = parseInt(limit) || 20;
    const query = search.toLowerCase();
    let filtered = VARIABLES.filter((variable) => variable.name.toLowerCase().includes(query));
    if (sortedOrder.length) {
        const orderSet = new Set(sortedOrder);
        const sort = sortedOrder
            .map((id) => filtered.find((item) => item.id === id))
            .filter(Boolean);
        const rest = filtered.filter((item) => !orderSet.has(item.id));
        filtered = [...sort, ...rest];
    }
    const result = filtered.slice(step, step + lim);
    res.json(result);
});
app.post("/select", (req, res) => {
    const { id, selected } = req.body;
    if (selected) {
        selectedVariables.add(id);
    }
    else {
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
app.post('/variables-by-ids', (req, res) => {
    const { ids } = req.body;
    const result = VARIABLES.filter(item => ids.includes(item.id));
    res.json(result);
});
app.listen(PORT, () => {
    console.log(`http://localhost:${PORT}`);
});
