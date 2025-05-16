import Availability from "@/components/Availability";
import { useData } from "@/lib/context/DataContext";
import { useEffect, useState } from "react";

export default function InstructorTab() {
  const { instructors, loading } = useData();
  const [selectedInstructor, setSelectedInstructor] = useState<string>("");


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
        value={selectedInstructor}
        onChange={(e) => setSelectedInstructor(e.target.value)}
        style={styles.select}
      >
        <option value="">Select an instructor</option>
        {instructors.map((instructor) => (
          <option key={instructor.id} value={instructor.id}>
            {instructor.first_name} {instructor.last_name}
          </option>
        ))}
      </select>
      <Availability instructorId={selectedInstructor} />
    </div>
  )
}