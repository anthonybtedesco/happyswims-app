import BookingPortal from "@/components/BookingPortal";
import { useData } from "@/lib/context/DataContext";
import { useEffect, useState } from "react";

export default function BookTab() {
  const { clients, loading } = useData();
  const [selectedClient, setSelectedClient] = useState<string>("");


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