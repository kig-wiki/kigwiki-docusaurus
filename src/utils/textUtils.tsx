import React from 'react';

const parseLineWithLinks = (line: string, lineIndex: number): React.ReactNode[] => {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  
  const standardMarkdownPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
  const reversedPattern = /\(([^)]+)\)\[([^\]]+)\]/g;
  
  const matches: Array<{ index: number; text: string; url: string; length: number }> = [];
  
  for (const match of line.matchAll(standardMarkdownPattern)) {
    matches.push({
      index: match.index!,
      text: match[1],
      url: match[2],
      length: match[0].length
    });
  }
  
  for (const match of line.matchAll(reversedPattern)) {
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
      parts.push(line.substring(lastIndex, linkMatch.index));
    }
    
    parts.push(
      <a
        key={`link-${lineIndex}-${idx}`}
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
  
  if (lastIndex < line.length) {
    parts.push(line.substring(lastIndex));
  }
  
  return parts.length > 0 ? parts : [line];
};

export const parseNotesWithLinks = (notes: string): React.ReactNode[] => {
  const lines = notes.split('\n');
  const result: React.ReactNode[] = [];
  
  lines.forEach((line, index) => {
    const isLastLine = index === lines.length - 1;
    const isEmpty = line.trim() === '';
    
    if (isEmpty) {
      if (!isLastLine) {
        result.push(<br key={`br-${index}`} />);
      }
    } else {
      const parsedLine = parseLineWithLinks(line, index);
      result.push(...parsedLine);
      
      if (!isLastLine) {
        result.push(<br key={`br-after-${index}`} />);
      }
    }
  });
  
  return result.length > 0 ? result : [notes];
};

