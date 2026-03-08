import { createContext, useContext, useState } from "react";

interface FilterState {
  search: string;
  platform: string;
  status: string;
  event: string;
  searchQuery: string;
  setSearch: (v: string) => void;
  setPlatform: (v: string) => void;
  setStatus: (v: string) => void;
  setEvent: (v: string) => void;
  submitSearch: () => void;
  clearSearch: () => void;
}

const FilterContext = createContext<FilterState | null>(null);

export function FilterProvider({ children }: { children: React.ReactNode }) {
  const [search, setSearch] = useState("");
  const [platform, setPlatform] = useState("all");
  const [status, setStatus] = useState("all");
  const [event, setEvent] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const submitSearch = () => {
    if (search.trim()) setSearchQuery(search.trim());
  };

  const clearSearch = () => {
    setSearch("");
    setSearchQuery("");
  };

  return (
    <FilterContext.Provider value={{ search, platform, status, event, searchQuery, setSearch, setPlatform, setStatus, setEvent, submitSearch, clearSearch }}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters() {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error("useFilters must be used within FilterProvider");
  return ctx;
}
