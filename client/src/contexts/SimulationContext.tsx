import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { SERVER_URL } from "@/lib/server";

export interface SimulatedStudent {
  id: string;
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: "student";
  category?: string;
  code?: string;
  createdAt?: string;
}

interface SimulationContextType {
  simulatedStudent: SimulatedStudent | null;
  isSimulating: boolean;
  loading: boolean;
  error: string | null;
  startSimulation: (email: string) => Promise<boolean>;
  stopSimulation: () => void;
}

const SimulationContext = createContext<SimulationContextType>(
  {} as SimulationContextType,
);

export const SimulationProvider = ({ children }: { children: ReactNode }) => {
  const [simulatedStudent, setSimulatedStudent] =
    useState<SimulatedStudent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startSimulation = useCallback(
    async (email: string): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem("token");
        const res = await fetch(
          `${SERVER_URL}/admin/simulate/lookup?email=${encodeURIComponent(email.trim())}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const data = await res.json();

        if (data.success && data.student) {
          setSimulatedStudent(data.student);
          // Persist to sessionStorage so simulation survives a page refresh
          sessionStorage.setItem(
            "simulatedStudent",
            JSON.stringify(data.student),
          );
          return true;
        } else {
          setError(data.message || "Student not found");
          return false;
        }
      } catch {
        setError("Network error. Please check your connection.");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const stopSimulation = useCallback(() => {
    setSimulatedStudent(null);
    setError(null);
    sessionStorage.removeItem("simulatedStudent");
  }, []);

  // Restore simulation from sessionStorage on mount (survives page refresh)
  React.useEffect(() => {
    const stored = sessionStorage.getItem("simulatedStudent");
    if (stored) {
      try {
        setSimulatedStudent(JSON.parse(stored));
      } catch {
        sessionStorage.removeItem("simulatedStudent");
      }
    }
  }, []);

  return (
    <SimulationContext.Provider
      value={{
        simulatedStudent,
        isSimulating: simulatedStudent !== null,
        loading,
        error,
        startSimulation,
        stopSimulation,
      }}
    >
      {children}
    </SimulationContext.Provider>
  );
};

export const useSimulation = () => useContext(SimulationContext);
