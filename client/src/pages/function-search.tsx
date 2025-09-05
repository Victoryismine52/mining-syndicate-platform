import { useEffect, useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
} from "@/components/ui/sidebar";

interface FunctionMeta {
  name: string;
  signature: string;
  path: string;
  tags: string[];
}

export function FunctionSearchPage() {
  const [query, setQuery] = useState("");
  const [functions, setFunctions] = useState<FunctionMeta[]>([]);

  useEffect(() => {
    fetch("/api/functions")
      .then((res) => res.json())
      .then((data) => setFunctions(data))
      .catch(() => setFunctions([]));
  }, []);

  const filtered = functions.filter((f) =>
    f.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <SidebarProvider>
      <div className="flex h-screen">
        <Sidebar>
          <SidebarHeader>
            <SidebarInput
              placeholder="Search functions..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {filtered.map((fn) => (
                <SidebarMenuItem key={`${fn.path}-${fn.name}`}>
                  <SidebarMenuButton asChild>
                    <div className="flex flex-col items-start">
                      <span>{fn.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {fn.path}
                      </span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>
      </div>
    </SidebarProvider>
  );
}

export default FunctionSearchPage;
