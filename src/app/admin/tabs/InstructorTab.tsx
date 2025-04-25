import Availability from "@/components/Availability";
import { useInstructors } from "@/data/DataContext";
import { useEffect, useState } from "react";

export default function InstructorTab() {
  const { data: instructors, fetchInstructors, loading } = useInstructors();
  const [selectedInstructor, setSelectedInstructor] = useState<string>("");

  useEffect(() => {
    fetchInstructors(1, 100); // Fetch first 100 instructors
  }, [fetchInstructors]);

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