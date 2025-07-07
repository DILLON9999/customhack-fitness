'use client';

import React from 'react';

export default function IconAttribution() {
  const attributions = [
    { name: 'Vitaly Gorbachev', url: 'https://www.flaticon.com/authors/vitaly-gorbachev' },
    { name: 'Freepik', url: 'https://www.freepik.com' },
    { name: 'Iconriver', url: 'https://www.flaticon.com/authors/iconriver' },
    { name: 'Us and Up', url: 'https://www.flaticon.com/authors/us-and-up' },
    { name: 'riajulislam', url: 'https://www.flaticon.com/authors/riajulislam' },
    { name: 'Dragon Icons', url: 'https://www.flaticon.com/authors/dragon-icons' },
    { name: 'Vectoricons', url: 'https://www.flaticon.com/authors/vectoricons' }
  ];

  return (
    <div className="text-xs text-gray-500 mt-4 space-y-1">
      {attributions.map((attr, index) => (
        <div key={index}>
          Icons made by{' '}
          <a 
            href={attr.url} 
            title={attr.name} 
            className="text-blue-500 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            {attr.name}
          </a>{' '}
          from{' '}
          <a 
            href="https://www.flaticon.com/" 
            title="Flaticon" 
            className="text-blue-500 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            www.flaticon.com
          </a>
        </div>
      ))}
    </div>
  );
} 