import "./App.css";
import { useCount, useStep } from "./store";

export default function App() {
  return <Counter />;
}

// Counter component
export function Counter() {
  const [count, setCount] = useCount();
  const [step, setStep] = useStep();

  const increment = () => {
    setCount(count + step);
  };

  const decrement = () => {
    setCount(count - step);
  };

  const reset = () => {
    setCount(0);
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h2>Bonsai Counter Example</h2>

      <div style={{ marginBottom: "20px" }}>
        <h3>Count: {count}</h3>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <button onClick={increment} style={{ marginRight: "10px" }}>
          +{step}
        </button>
        <button onClick={decrement} style={{ marginRight: "10px" }}>
          -{step}
        </button>
        <button onClick={reset}>Reset</button>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <label htmlFor="step">Step size: </label>
        <input
          id="step"
          type="number"
          value={step}
          onChange={(e) => setStep(parseInt(e.target.value) || 1)}
          style={{ width: "60px", marginLeft: "10px" }}
        />
      </div>

      <div style={{ fontSize: "12px", color: "#666" }}>
        <p>This example demonstrates:</p>
        <ul>
          <li>Creating a typed store with initial state</li>
          <li>
            Creating selective hooks that only re-render when specific data
            changes
          </li>
          <li>Updating the store with partial state updates</li>
        </ul>
      </div>
    </div>
  );
}
