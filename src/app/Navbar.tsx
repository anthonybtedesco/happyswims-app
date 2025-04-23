'use client'

import React, { useEffect, useState } from 'react';


const Navbar: React.FC = () => {
  const [cookies, setCookies] = useState<string>('');

  useEffect(() => {
    // Function to get all cookies
    const getCookies = () => {
      return document.cookie;
    };

    // Set cookies to state
    setCookies(getCookies());
  }, []);

  return (
    <div style={{
      backgroundColor: 'white',
      borderBottom: '1px solid gray',
      padding: '10px'
    }}>
      <div>Cookies: {cookies}</div>
    </div>
  );
};

export default Navbar; 