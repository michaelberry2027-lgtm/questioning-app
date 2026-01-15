type PinPadProps = {
  value: string;               // current 0–4 digit PIN string
  onChange: (value: string) => void;
};

export default function PinPad({ value, onChange }: PinPadProps) {
  const handleDigit = (digit: string) => {
    if (value.length >= 4) return;
    onChange(value + digit);
  };

  const handleBackspace = () => {
    if (value.length === 0) return;
    onChange(value.slice(0, -1));
  };

  const circles = [0, 1, 2, 3];

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Dots */}
      <div className="flex gap-2">
        {circles.map((i) => (
          <div
            key={i}
            className="w-4 h-4 rounded-full border border-black flex items-center justify-center"
          >
            {value.length > i ? (
              <span className="w-2 h-2 rounded-full bg-black" />
            ) : null}
          </div>
        ))}
      </div>

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-2 mt-2">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => handleDigit(String(n))}
            className="w-16 h-12 border border-black rounded-xl text-lg"
          >
            {n}
          </button>
        ))}

        <div />
        <button
          type="button"
          onClick={() => handleDigit("0")}
          className="w-16 h-12 border border-black rounded-xl text-lg"
        >
          0
        </button>
        <button
          type="button"
          onClick={handleBackspace}
          className="w-16 h-12 border border-black rounded-xl text-lg"
        >
          ⌫
        </button>
      </div>
    </div>
  );
}
