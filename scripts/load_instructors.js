const fs = require('fs');
const csv = require('csv-parser');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function loadInstructors() {
  const instructors = [];
  
  return new Promise((resolve, reject) => {
    fs.createReadStream('datasets/instructors.csv')
      .pipe(csv())
      .on('data', (row) => {
        instructors.push({
          first_name: row.name.split(' ')[0],
          last_name: row.name.split(' ').slice(1).join(' '),
          phone_number: row.phone_number
        });
      })
      .on('end', async () => {
        try {
          console.log('Loading instructors into database...');
          
          for (const instructor of instructors) {
            const { data, error } = await supabase
              .from('instructor')
              .insert({
                first_name: instructor.first_name,
                last_name: instructor.last_name,
                phone_number: instructor.phone_number
              });
            
            if (error) {
              console.error(`Error inserting ${instructor.first_name} ${instructor.last_name}:`, error);
            } else {
              console.log(`✓ Loaded: ${instructor.first_name} ${instructor.last_name} (${instructor.phone_number})`);
            }
          }
          
          console.log('Instructor loading complete!');
          resolve();
        } catch (error) {
          console.error('Error loading instructors:', error);
          reject(error);
        }
      });
  });
}

loadInstructors().catch(console.error); 