import { Link, useLocation, useSearchParams } from "react-router-dom";
import { Store, ChefHat, BarChart3, Utensils } from "lucide-react";
import { useEffect, useState } from "react";

export const GlobalNav = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [isVisible, setIsVisible] = useState(() => localStorage.getItem("staffMode") === "true");

  useEffect(() => {
    if (searchParams.get("admin") === "true") {
      localStorage.setItem("staffMode", "true");
      setIsVisible(true);
    }
  }, [searchParams]);

  const staffPaths = ["/admin", "/balcao"];
  if (!isVisible || !staffPaths.includes(location.pathname)) return null;

  const tabs = [
    { path: "/", label: "Loja", icon: Store },

    { path: "/balcao", label: "Balcão", icon: Utensils },
    { path: "/admin", label: "Admin", icon: BarChart3 },
  ];

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
      <div className="bg-[#111] border border-white/10 rounded-full p-1.5 flex items-center gap-1 shadow-2xl shadow-black/50">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = location.pathname === tab.path;

          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full transition-all duration-300 font-bold text-sm ${
                isActive 
                  ? "bg-primary text-black" 
                  : "text-muted-foreground hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden md:inline">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
