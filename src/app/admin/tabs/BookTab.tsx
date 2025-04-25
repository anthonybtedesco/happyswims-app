import BookingPortal from "@/components/BookingPortal";
import { useClients } from "@/data/DataContext";
import { useEffect, useState } from "react";

export default function BookTab() {
  const { data: clients, fetchClients, loading } = useClients();
  const [selectedClient, setSelectedClient] = useState<string>("");

  useEffect(() => {
    fetchClients(1, 100); // Fetch first 100 clients
  }, [fetchClients]);

  const styles = {
    select: {
      width: "100%",
      padding: "8px",
      marginBottom: "20px",
      border: "1px solid #ccc",
      borderRadius: "4px",
      fontSize: "16px",
      backgroundColor: "white"
    }
  };

  return (
    <div>
      <select 
        value={selectedClient}
        onChange={(e) => setSelectedClient(e.target.value)}
        style={styles.select}
      >
        <option value="">Select a client</option>
        {clients.map((client) => (
          <option key={client.id} value={client.id}>
            {client.first_name} {client.last_name}
          </option>
        ))}
      </select>
      <BookingPortal clientId={selectedClient} />
    </div>
  )
}