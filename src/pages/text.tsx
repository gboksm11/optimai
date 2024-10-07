import React, { useState, useEffect, useRef } from 'react';
import { createMarkdownStreamParser, MarkdownStreamParser } from '@nlux/markdown';

// Simulated streaming function
const streamText = async function* () {
  const text = "# Streaming Markdown\n\nThis is a **bold** statement.\n\nHere's a list:\n1. First item\n2. Second item\n3. Third item\n\n```javascript\nconst code = 'example';\nconsole.log(code);\n```";
  const chunks = text.split(' ');
  for (let chunk of chunks) {
    yield chunk + ' ';
    await new Promise(resolve => setTimeout(resolve, 200)); // Simulate delay
  }
};

const OriginalApproach = () => {
  const [content, setContent] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      for await (const chunk of streamText()) {
        setContent(prev => prev + chunk);
      }
    };
    fetchData();
  }, []);

  return (
    <div>
      <h2>Original Approach</h2>
      <div>{content}</div>
    </div>
  );
};

const ImprovedApproach = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const parserRef = useRef<MarkdownStreamParser | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      parserRef.current = createMarkdownStreamParser(containerRef.current, {
        skipStreamingAnimation: false,
        streamingAnimationSpeed: 10,
        waitTimeBeforeStreamCompletion: 2000,
        onComplete: () => console.log("Parsing complete"),
      });
    }

    const fetchData = async () => {
      for await (const chunk of streamText()) {
        parserRef.current?.next(chunk);
      }
      parserRef.current?.complete();
    };

    fetchData();

    return () => {
      // Clean up if necessary
    };
  }, []);

  return (
    <div>
      <h2>Improved Approach</h2>
      <div ref={containerRef}></div>
    </div>
  );
};

const StreamingTextDemo = () => {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-around' }}>
      <OriginalApproach />
      <ImprovedApproach />
    </div>
  );
};

export default StreamingTextDemo;