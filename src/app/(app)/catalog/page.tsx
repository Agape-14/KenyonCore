"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Modal from "@/components/ui/Modal";
import { formatCurrency } from "@/lib/utils";
import { Plus, Search, ChevronDown, ChevronRight, Package } from "lucide-react";

interface CatalogItem {
  id: string;
  name: string;
  description?: string;
  defaultUnit: string;
  estimatedPrice?: number;
}

interface Subcategory {
  id: string;
  name: string;
  items: CatalogItem[];
}

interface Category {
  id: string;
  name: string;
  trade: string;
  subcategories: Subcategory[];
}

const tradeOptions = [
  { value: "", label: "All Trades" },
  { value: "PLUMBING", label: "Plumbing" },
  { value: "ELECTRICAL", label: "Electrical" },
  { value: "HVAC", label: "HVAC" },
  { value: "GENERAL", label: "General" },
  { value: "CARPENTRY", label: "Carpentry" },
  { value: "PAINTING", label: "Painting" },
  { value: "ROOFING", label: "Roofing" },
  { value: "FLOORING", label: "Flooring" },
  { value: "CONCRETE", label: "Concrete" },
  { value: "LANDSCAPING", label: "Landscaping" },
];

export default function CatalogPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [trade, setTrade] = useState("");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [showAdd, setShowAdd] = useState(false);
  const [addType, setAddType] = useState<"category" | "subcategory" | "item">("category");
  const [addForm, setAddForm] = useState({
    name: "",
    trade: "GENERAL",
    categoryId: "",
    subcategoryId: "",
    description: "",
    defaultUnit: "each",
    estimatedPrice: "",
  });

  const fetchCatalog = () => {
    const params = new URLSearchParams();
    if (trade) params.set("trade", trade);
    if (search) params.set("search", search);

    fetch(`/api/catalog?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setCategories(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchCatalog();
  }, [trade]);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();

    const body: Record<string, unknown> = { type: addType, name: addForm.name };

    if (addType === "category") {
      body.trade = addForm.trade;
    } else if (addType === "subcategory") {
      body.categoryId = addForm.categoryId;
    } else {
      body.subcategoryId = addForm.subcategoryId;
      body.description = addForm.description;
      body.defaultUnit = addForm.defaultUnit;
      body.estimatedPrice = parseFloat(addForm.estimatedPrice) || undefined;
    }

    const res = await fetch("/api/catalog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      setShowAdd(false);
      setAddForm({ name: "", trade: "GENERAL", categoryId: "", subcategoryId: "", description: "", defaultUnit: "each", estimatedPrice: "" });
      fetchCatalog();
    }
  };

  const totalItems = categories.reduce(
    (s, c) => s + c.subcategories.reduce((s2, sc) => s2 + sc.items.length, 0),
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Materials Catalog</h1>
          <p className="text-sm text-gray-500 mt-1">
            {categories.length} categories, {totalItems} items
          </p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus size={16} className="mr-2" /> Add to Catalog
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchCatalog();
          }}
          className="flex-1 relative"
        >
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search catalog..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
        </form>
        <Select value={trade} onChange={(e) => setTrade(e.target.value)} options={tradeOptions} className="w-full sm:w-48" />
      </div>

      {/* Catalog Tree */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : categories.length > 0 ? (
        <div className="space-y-3">
          {categories.map((cat) => (
            <Card key={cat.id}>
              <button
                onClick={() => toggleExpand(cat.id)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {expanded.has(cat.id) ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900">{cat.name}</h3>
                    <p className="text-xs text-gray-400">{cat.trade} &middot; {cat.subcategories.length} subcategories</p>
                  </div>
                </div>
              </button>

              {expanded.has(cat.id) && (
                <div className="border-t border-gray-100 px-5 pb-4">
                  {cat.subcategories.map((sub) => (
                    <div key={sub.id} className="mt-3">
                      <button
                        onClick={() => toggleExpand(sub.id)}
                        className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                      >
                        {expanded.has(sub.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        {sub.name}
                        <span className="text-xs text-gray-400">({sub.items.length})</span>
                      </button>

                      {expanded.has(sub.id) && sub.items.length > 0 && (
                        <div className="ml-6 mt-2 space-y-1">
                          {sub.items.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 text-sm"
                            >
                              <div className="flex items-center gap-2">
                                <Package size={14} className="text-gray-400" />
                                <span>{item.name}</span>
                                {item.description && (
                                  <span className="text-gray-400 text-xs">— {item.description}</span>
                                )}
                              </div>
                              <div className="flex items-center gap-4 text-gray-400">
                                <span>{item.defaultUnit}</span>
                                {item.estimatedPrice && (
                                  <span className="font-medium text-gray-600">
                                    {formatCurrency(item.estimatedPrice)}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {cat.subcategories.length === 0 && (
                    <p className="text-sm text-gray-400 mt-3">No subcategories yet</p>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400">
          No catalog items found. Add your first category to get started.
        </div>
      )}

      {/* Add Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add to Catalog">
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="flex gap-2 mb-4">
            {(["category", "subcategory", "item"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setAddType(t)}
                className={`px-3 py-1.5 text-sm rounded-lg ${
                  addType === t ? "bg-primary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          <Input
            label="Name"
            value={addForm.name}
            onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
            required
          />

          {addType === "category" && (
            <Select
              label="Trade"
              value={addForm.trade}
              onChange={(e) => setAddForm({ ...addForm, trade: e.target.value })}
              options={tradeOptions.filter((t) => t.value !== "")}
            />
          )}

          {addType === "subcategory" && (
            <Select
              label="Parent Category"
              value={addForm.categoryId}
              onChange={(e) => setAddForm({ ...addForm, categoryId: e.target.value })}
              options={[
                { value: "", label: "Select category..." },
                ...categories.map((c) => ({ value: c.id, label: `${c.name} (${c.trade})` })),
              ]}
              required
            />
          )}

          {addType === "item" && (
            <>
              <Select
                label="Subcategory"
                value={addForm.subcategoryId}
                onChange={(e) => setAddForm({ ...addForm, subcategoryId: e.target.value })}
                options={[
                  { value: "", label: "Select subcategory..." },
                  ...categories.flatMap((c) =>
                    c.subcategories.map((sc) => ({
                      value: sc.id,
                      label: `${c.name} > ${sc.name}`,
                    }))
                  ),
                ]}
                required
              />
              <Input
                label="Description"
                value={addForm.description}
                onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Default Unit"
                  value={addForm.defaultUnit}
                  onChange={(e) => setAddForm({ ...addForm, defaultUnit: e.target.value })}
                />
                <Input
                  label="Estimated Price"
                  type="number"
                  step="0.01"
                  value={addForm.estimatedPrice}
                  onChange={(e) => setAddForm({ ...addForm, estimatedPrice: e.target.value })}
                />
              </div>
            </>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button type="submit">Add</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
