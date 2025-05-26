import React, { useEffect, useState } from "react";
import axios from "axios";
import type { Item } from "../@types/types";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

import type { DropResult } from "react-beautiful-dnd";

import "./App.css";

const API = "https://test-api-fullstack.onrender.com";
const LIMIT = 20;

const App: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [sortedOrder, setSortedOrder] = useState<number[]>([]);
  const [dots, setDots] = useState("");

  type StateData = {
    selected: number[];
    sorted: number[];
  };

  const fetchState = async () => {
    setLoading(true);
    const res = await axios.get<StateData>(`${API}/state`);
    setSelected(new Set(res.data.selected));
    setSortedOrder(res.data.sorted);
  };

  const fetchItems = async (offsetParam: number, append = false) => {
    if (!loading) {
      setLoading(true);
    }
    const res = await axios.get<Item[]>(`${API}/variables`, {
      params: { offset: offsetParam, limit: LIMIT, search },
    });
    const fetched = res.data;

    setItems((prev) => (append ? [...prev, ...fetched] : fetched));
    setOffset(offsetParam + fetched.length);
    setHasMore(fetched.length === LIMIT);
    setLoading(false);
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      const loadInitial = async () => {
        await fetchState();
        await fetchItems(0, false);
      };
      loadInitial();
    }, 500);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Load more
  const loadMore = () => {
    if (loading || !hasMore) return;
    fetchItems(offset, true);
  };

  useEffect(() => {
    if (sortedOrder?.length === 0 || items?.length === 0) return;

    const orderSet = new Set(sortedOrder);
    if (sortedOrder === undefined) {
      return;
    }
    const sortedItems = [
      ...(sortedOrder
        .map((id) => items.find((i) => i.id === id))
        .filter(Boolean) as Item[]),
      ...items.filter((i) => !orderSet.has(i.id)),
    ];
    setItems(sortedItems);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortedOrder]);

  const toggleSelect = async (id: number) => {
    const newSelected = new Set(selected);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelected(newSelected);

    await axios.post(`${API}/select`, { id, selected: newSelected.has(id) });
  };

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const newItems = Array.from(items);
    const [removed] = newItems.splice(result.source.index, 1);
    newItems.splice(result.destination.index, 0, removed);

    setItems(newItems);
    const newOrder = newItems.map((i) => i.id);
    setSortedOrder(newOrder);

    await axios.post(`${API}/sort`, { ids: newOrder });
  };

  const resetState = async () => {
    await axios.post(`${API}/reset`);
    setSelected(new Set());
    setSortedOrder([]);
    setSearch("");
    setItems([]);
    setOffset(0);
    setHasMore(true);
    await fetchItems(0, false);
  };

  const isSearchActive = search.trim().length > 0;

  useEffect(() => {
    if (!loading) {
      setDots("");
      return;
    }

    const interval = setInterval(() => {
      setDots((prev) => (prev.length < 3 ? prev + "." : ""));
    }, 500);
    return () => clearInterval(interval);
  }, [loading]);

  return (
    <div style={{ maxWidth: 600, margin: "auto", padding: 16 }}>
      <input
        style={{ width: "100%", padding: 8, marginBottom: 12 }}
        placeholder="Search..."
        value={search}
        onChange={(e) => {
          setItems([]);
          setOffset(0);
          setSearch(e.target.value);
          setHasMore(true);
        }}
      />
      <button
        onClick={resetState}
        style={{ cursor: "pointer", marginBottom: "5px" }}
      >
        Сбросить сортировку
      </button>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="list">
          {(provided) => (
            <div
              className="div1"
              {...provided.droppableProps}
              ref={provided.innerRef}
              onScroll={(e) => {
                const el = e.currentTarget;
                if (el.scrollTop + el.clientHeight >= el.scrollHeight - 10) {
                  loadMore();
                }
              }}
            >
              {items.map((item, index) => (
                <Draggable
                  key={item.id}
                  draggableId={item.id.toString()}
                  index={index}
                  isDragDisabled={isSearchActive}
                >
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      style={{
                        userSelect: "none",
                        padding: 8,
                        borderRadius: 4,
                        background: snapshot.isDragging ? "#e0f7fa" : "#fff",
                        boxShadow: snapshot.isDragging
                          ? "0 2px 8px rgba(0,0,0,0.2)"
                          : "none",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        ...provided.draggableProps.style,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(item.id)}
                        onChange={() => toggleSelect(item.id)}
                      />
                      <span>{item.name}</span>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
              {loading && (
                <div style={{ padding: 8, textAlign: "center" }}>
                  Loading{dots}
                </div>
              )}
              {!hasMore && !loading && items.length > 0 && (
                <div style={{ padding: 8, textAlign: "center", color: "#666" }}>
                  No more items
                </div>
              )}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
};

export default App;
