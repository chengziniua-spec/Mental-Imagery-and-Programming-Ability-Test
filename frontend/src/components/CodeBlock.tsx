interface Props {
  code: string;
  currentLine?: number;
}

export function CodeBlock({ code, currentLine }: Props) {
  const lines = code.replace(/\n$/, "").split("\n");
  return (
    <pre className="code-block">
      <code>
        {lines.map((line, index) => {
          const lineNumber = index + 1;
          const isCurrent = lineNumber === currentLine;
          return (
            <div key={lineNumber} className={`code-line${isCurrent ? " code-line-current" : ""}`}>
              <span className="code-lineno">{lineNumber}</span>
              <span className="code-text">{line || " "}</span>
            </div>
          );
        })}
      </code>
    </pre>
  );
}
