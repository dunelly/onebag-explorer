import { useState, useMemo } from "react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tag, Star, DollarSign, ThumbsUp, Luggage, Backpack, Laptop, GlassWater, List, 
         FlipVertical, SquareStack, Archive, RectangleEllipsis, ShoppingBag, ShoppingBasket, MoveDiagonal, LayoutGrid, HelpCircle 
       } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import backpackData from "../data";
import combinedAnalysis from "../data/analysis/combined_analysis.json";

const OpeningIcon = ({ type }) => {
  const commonProps = { size: 16, className: "text-muted-foreground flex-shrink-0" };
  const typeLower = type.toLowerCase();

  switch (typeLower) {
    case 'clamshell':
      return <FlipVertical {...commonProps} title="Clamshell opening" />;
    case 'panel-loading':
      return <SquareStack {...commonProps} title="Panel opening" />;
    case 'top-loading':
      return <Archive {...commonProps} title="Top opening" />;
    case 'roll-top':
      return <RectangleEllipsis {...commonProps} title="Roll-top opening" />;
    case 'duffel':
      return <ShoppingBag {...commonProps} title="Duffel opening" />;
    case 'tote':
      return <ShoppingBasket {...commonProps} title="Tote opening" />;
    case 'sling':
      return <MoveDiagonal {...commonProps} title="Sling opening" />;
    case 'segmented':
      return <LayoutGrid {...commonProps} title="Segmented opening" />;
    default:
      return <HelpCircle {...commonProps} title="Other opening" />;
  }
};

export default function OneBagHomepage() {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [filter, setFilter] = useState(null);
  const [displayUnit, setDisplayUnit] = useState("kg");

  // Helper function for kg to lb conversion
  const kgToLb = (kg) => (kg * 2.20462).toFixed(1);
  const lbToKg = (lb) => (lb / 2.20462).toFixed(1);

  // Define Volume Filters
  const volumeFilters = [
    { label: "All Volumes", min: 0, max: Infinity },
    { label: "Daypack (< 20L)", min: 0, max: 19 },
    { label: "Small (20-29L)", min: 20, max: 29 },
    { label: "Medium (30-39L)", min: 30, max: 39 },
    { label: "Large (40L+)", min: 40, max: Infinity },
  ];

  const [activeVolumeFilter, setActiveVolumeFilter] = useState(volumeFilters[0]); // Default to 'All Volumes'

  // Define Weight Filters (Update labels based on displayUnit)
  const weightFilters = useMemo(() => [
    { label: "All Weights", min: 0, max: Infinity },
    {
      label: displayUnit === "kg"
        ? `Ultralight (< 0.9kg)`
        : `Ultralight (< ${kgToLb(0.9)}lb)`,
      min: 0, max: 0.89
    },
    {
      label: displayUnit === "kg"
        ? `Average (0.9kg - 1.3kg)`
        : `Average (${kgToLb(0.9)}lb - ${kgToLb(1.3)}lb)`,
      min: 0.9, max: 1.3
    },
    {
      label: displayUnit === "kg"
        ? `Heavy (> 1.3kg)`
        : `Heavy (> ${kgToLb(1.3)}lb)`,
      min: 1.31, max: Infinity
    },
  ], [displayUnit]); // Re-calculate when displayUnit changes

  const [activeWeightFilter, setActiveWeightFilter] = useState(weightFilters[0]); // Default to 'All Weights'

  // Define Price Filters
  const priceFilters = [
    { label: "All Prices", min: 0, max: Infinity },
    { label: "$0 - $150", min: 0, max: 150 },
    { label: "$150 - $250", min: 150, max: 250 },
    { label: "$250+", min: 250, max: Infinity },
  ];
  const [activePriceFilter, setActivePriceFilter] = useState(priceFilters[0]); // Default to 'All Prices'

  // Define Opening Type Filters
  const openingTypes = useMemo(() => {
    if (!backpackData || backpackData.length === 0) return [];
    const types = new Set(backpackData.map(item => item.openingStyle).filter(Boolean)); // Filter out null/undefined
    return ["All Opening Types", ...Array.from(types).sort()];
  }, []);

  const [activeOpeningFilter, setActiveOpeningFilter] = useState(openingTypes[0]); // Default to All

  const sortedData = [...backpackData]
    .filter((item) => {
      const matchesExistingFilter = !filter || filter(item);
      const matchesVolumeFilter = item.volume >= activeVolumeFilter.min && item.volume <= activeVolumeFilter.max;
      const matchesWeightFilter = item.weight >= activeWeightFilter.min && item.weight <= activeWeightFilter.max;
      const matchesPriceFilter = item.price >= activePriceFilter.min && item.price <= activePriceFilter.max;
      const matchesOpeningFilter = activeOpeningFilter === "All Opening Types" || item.openingStyle === activeOpeningFilter;
      return matchesExistingFilter && matchesVolumeFilter && matchesWeightFilter && matchesPriceFilter && matchesOpeningFilter;
    })
    .sort((a, b) => {
      if (!sortConfig.key) return 0;
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc"
    }));
  };

  // Create a lookup for sentiment by backpack name
  const sentimentLookup = {};
  if (combinedAnalysis && combinedAnalysis.backpacks) {
    for (const b of combinedAnalysis.backpacks) {
      sentimentLookup[b.name] = b.sentiment;
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-[250px_1fr] gap-6 items-start">
      <aside className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-4">
        <div className="mt-0 pt-0">
          <h2 className="text-sm font-semibold text-muted-foreground mb-2">Volume Filter</h2>
          <ul className="space-y-1">
            {volumeFilters.map((vf) => (
              <li key={vf.label}>
                <button
                  onClick={() => setActiveVolumeFilter(vf)}
                  className={`w-full text-left text-sm px-3 py-1.5 rounded-md hover:bg-gray-100 ${activeVolumeFilter.label === vf.label ? 'bg-blue-100 font-semibold text-blue-700' : 'text-black'}`}
                >
                  {vf.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="pt-4 border-t">
          <h2 className="text-sm font-semibold text-muted-foreground mb-2">Weight Filter ({displayUnit === 'kg' ? 'Kilograms' : 'Pounds'})</h2>
          <ul className="space-y-1">
            {weightFilters.map((wf) => (
              <li key={wf.label}>
                <button
                  onClick={() => setActiveWeightFilter(wf)}
                  className={`w-full text-left text-sm px-3 py-1.5 rounded-md hover:bg-gray-100 ${activeWeightFilter.label === wf.label ? 'bg-blue-100 font-semibold text-blue-700' : 'text-black'}`}
                >
                  {wf.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="pt-4 border-t">
          <h2 className="text-sm font-semibold text-muted-foreground mb-2">Price Filter</h2>
          <ul className="space-y-1">
            {priceFilters.map((pf) => (
              <li key={pf.label}>
                <button
                  onClick={() => setActivePriceFilter(pf)}
                  className={`w-full text-left text-sm px-3 py-1.5 rounded-md hover:bg-gray-100 ${activePriceFilter.label === pf.label ? 'bg-blue-100 font-semibold text-blue-700' : 'text-black'}`}
                >
                  {pf.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="pt-4 border-t">
          <h2 className="text-sm font-semibold text-muted-foreground mb-2">Opening Type</h2>
          <ul className="space-y-1">
            {openingTypes.map((type) => (
              <li key={type}>
                <button
                  onClick={() => setActiveOpeningFilter(type)}
                  className={`w-full text-left text-sm px-3 py-1.5 rounded-md hover:bg-gray-100 flex items-center gap-2 ${activeOpeningFilter === type ? 'bg-blue-100 font-semibold text-blue-700' : 'text-black'}`}
                >
                  {type === "All Opening Types" ? 
                    <List size={16} className="text-muted-foreground flex-shrink-0" /> : 
                    <OpeningIcon type={type.toLowerCase()} />
                  }
                  <span>{type}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <main className="space-y-6">
        <div className="flex justify-between items-center mb-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">The OneBag Index</h1>
            <p className="text-muted-foreground">Backpacks ranked by real-world use and Reddit reviews</p>
          </div>
          <div className="flex items-center space-x-2">
            <Label htmlFor="unit-toggle">Kg</Label>
            <Switch
              id="unit-toggle"
              checked={displayUnit === "lbs"}
              onCheckedChange={(checked) => setDisplayUnit(checked ? "lbs" : "kg")}
              aria-label="Toggle weight units between kilograms and pounds"
            />
            <Label htmlFor="unit-toggle">Lbs</Label>
          </div>
        </div>
        <Input
          type="text"
          placeholder="Search backpacks..."
          className="w-full max-w-sm"
          onChange={(e) => {
            const searchTerm = e.target.value.toLowerCase();
            setFilter(() => (item) => 
              item.name.toLowerCase().includes(searchTerm) || 
              item.brand.toLowerCase().includes(searchTerm)
            );
          }}
        />

        <div className="rounded-xl border bg-white shadow p-4">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-left font-semibold text-muted-foreground">
                  <th className="py-2 pr-4 cursor-pointer" onClick={() => handleSort("brand")}>Brand</th>
                  <th className="py-2 pr-4 cursor-pointer" onClick={() => handleSort("name")}>Product</th>
                  <th className="py-2 pr-4 cursor-pointer" onClick={() => handleSort("volume")}>Volume</th>
                  <th className="py-2 pr-4 cursor-pointer" onClick={() => handleSort("weight")}>Weight ({displayUnit})</th>
                  <th className="py-2 pr-4 cursor-pointer" onClick={() => handleSort("price")}>Price</th>
                  <th className="py-2 pr-4 cursor-pointer" onClick={() => handleSort("openingStyle")}>Opening</th>
                  <th className="py-2 pr-4" title="Laptop Compartment"><Laptop size={16}/></th>
                  <th className="py-2 pr-4" title="Water Bottle Compartment"><GlassWater size={16}/></th>
                  <th className="py-2">View</th>
                </tr>
              </thead>
              <tbody>
                {sortedData.map((item, index) => (
                  <tr key={index} className="border-b hover:bg-muted/50">
                    <td className="py-2 pr-4">{item.brand}</td>
                    <td className="py-2 pr-4 font-medium text-primary">{item.name}</td>
                    <td className="py-2 pr-4">{item.volume}L</td>
                    <td className="py-2 pr-4">
                      {displayUnit === "kg"
                        ? `${item.weight}kg`
                        : `${kgToLb(item.weight)}lb`}
                    </td>
                    <td className="py-2 pr-4">${item.price}</td>
                    <td className="py-2 pr-4">{item.openingStyle}</td>
                    <td className="py-2 pr-4">{item.laptopCompartment === "Yes" ? <Laptop size={16} className="inline-block text-green-600"/> : ""}</td>
                    <td className="py-2 pr-4">{item.waterBottleCompartment === "Yes" ? <GlassWater size={16} className="inline-block text-blue-600"/> : ""}</td>
                    <td className="py-2">
                      <Button size="sm" asChild>
                        <a href={`/pack/${item.id}`}>View</a>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
