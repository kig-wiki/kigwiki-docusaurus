import React from 'react';

export const parseNotesWithLinks = (notes: string): React.ReactNode[] => {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  
  const standardMarkdownPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
  const reversedPattern = /\(([^)]+)\)\[([^\]]+)\]/g;
  
  const matches: Array<{ index: number; text: string; url: string; length: number }> = [];
  
  for (const match of notes.matchAll(standardMarkdownPattern)) {
    matches.push({
      index: match.index!,
      text: match[1],
      url: match[2],
      length: match[0].length
    });
  }
  
  for (const match of notes.matchAll(reversedPattern)) {
    matches.push({
      index: match.index!,
      text: match[1],
      url: match[2],
      length: match[0].length
    });
  }
  
  matches.sort((a, b) => a.index - b.index);
  
  matches.forEach((linkMatch, idx) => {
    if (linkMatch.index > lastIndex) {
      parts.push(notes.substring(lastIndex, linkMatch.index));
    }
    
    parts.push(
      <a
        key={`link-${idx}`}
        href={linkMatch.url}
        target="_blank"
        rel="noopener noreferrer"
        className="notes-link"
      >
        {linkMatch.text}
      </a>
    );
    
    lastIndex = linkMatch.index + linkMatch.length;
  });
  
  if (lastIndex < notes.length) {
    parts.push(notes.substring(lastIndex));
  }
  
  return parts.length > 0 ? parts : [notes];
};

