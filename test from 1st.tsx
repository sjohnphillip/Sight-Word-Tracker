import React, { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// ---------- DATA ----------
const fryLists: Record<string, string[]> = {
  "1st 100":
    "a about all and are as at be been but by can come could day did do down each find".split(" "),
  "2nd 100":
    "after again air also animal another answer any around ask away back because before big".split(" "),
};

const SECTIONS = Object.keys(fryLists);

// ---------- TYPES ----------
type Mastery = "secure" | "developing" | "unknown";

type History = {
  date: string;
  secure: number;
  developing: number;
  unknown: number;
};

type Student = {
  name: string;
  mastery: Record<string, Mastery>;
  history: History[];
};

// ---------- SIMPLE CARD ----------
function Card({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "white",
        border: "1px solid #e2e8f0",
        borderRadius: 24,
        padding: 16,
        marginBottom: 16,
      }}
    >
      {title && <h3 style={{ marginBottom: 12 }}>{title}</h3>}
      {children}
    </div>
  );
}

// ---------- APP ----------
export default function App() {
  const [student, setStudent] = useState<Student>({
    name: "",
    mastery: {},
    history: [],
  });

  const [section, setSection] = useState(SECTIONS[0]);

  const words = fryLists[section];
  const allWords = Object.values(fryLists).flat();

  // ---------- COUNTS ----------
  const counts = useMemo(() => {
    let secure = 0,
      developing = 0,
      unknown = 0;

    allWords.forEach((w) => {
      const m = student.mastery[w];
      if (m === "secure") secure++;
      else if (m === "developing") developing++;
      else unknown++;
    });

    return { secure, developing, unknown };
  }, [student.mastery, allWords]);

  // ---------- WORD SET ----------
  const setWord = (word: string, level: Mastery) => {
    setStudent((prev) => ({
      ...prev,
      mastery: { ...prev.mastery, [word]: level },
    }));
  };

  const toggleWord = (word: string) => {
    const current = student.mastery[word];
    const next = current === "secure" ? "unknown" : "secure";
    setWord(word, next);
  };

  // ---------- BULK ----------
  const markSection = (level: Mastery) => {
    const updates = { ...student.mastery };
    words.forEach((w) => (updates[w] = level));
    setStudent((prev) => ({ ...prev, mastery: updates }));
  };

  const resetSection = () => {
    const updates = { ...student.mastery };
    words.forEach((w) => delete updates[w]);
    setStudent((prev) => ({ ...prev, mastery: updates }));
  };

  const unknownToDeveloping = () => {
    const updates = { ...student.mastery };
    words.forEach((w) => {
      if (!updates[w] || updates[w] === "unknown") {
        updates[w] = "developing";
      }
    });
    setStudent((prev) => ({ ...prev, mastery: updates }));
  };

  const developingToSecure = () => {
    const updates = { ...student.mastery };
    words.forEach((w) => {
      if (updates[w] === "developing") {
        updates[w] = "secure";
      }
    });
    setStudent((prev) => ({ ...prev, mastery: updates }));
  };

  // ---------- SAVE ----------
  const saveAssessment = () => {
    setStudent((prev) => ({
      ...prev,
      history: [
        ...prev.history,
        {
          date: new Date().toLocaleDateString(),
          ...counts,
        },
      ],
    }));
  };

  const chartData = student.history.map((h, i) => ({
    id: i + 1,
    ...h,
  }));

  // ---------- UI ----------
  return (
    <div style={{ padding: 20, background: "#f8fafc", fontFamily: "Arial" }}>
      <h1>Fry Sight Word Tracker</h1>

      {/* STUDENT */}
      <Card>
        <input
          placeholder="Student name"
          value={student.name}
          onChange={(e) =>
            setStudent({ ...student, name: e.target.value })
          }
        />
      </Card>

      {/* SECTIONS */}
      <Card>
        {SECTIONS.map((s) => (
          <button
            key={s}
            onClick={() => setSection(s)}
            style={{
              marginRight: 8,
              padding: 6,
              borderRadius: 8,
              background: section === s ? "#ddd" : "#fff",
            }}
          >
            {s}
          </button>
        ))}
      </Card>

      {/* WORD GRID */}
      <Card title={section}>
        {/* TOOLBAR */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
          <button onClick={() => markSection("secure")}>All Secure</button>
          <button onClick={() => markSection("developing")}>All Developing</button>
          <button onClick={() => markSection("unknown")}>All Unknown</button>
          <button onClick={resetSection}>Reset</button>
          <button onClick={unknownToDeveloping}>Unknown → Dev</button>
          <button onClick={developingToSecure}>Dev → Secure</button>
        </div>

        {words.map((word) => {
          const mastery = student.mastery[word];

          const style = (level: Mastery) => ({
            marginRight: 6,
            background:
              mastery === level
                ? level === "secure"
                  ? "green"
                  : level === "developing"
                  ? "orange"
                  : "red"
                : "white",
            color: mastery === level ? "white" : "black",
          });

          return (
            <div key={word} style={{ marginBottom: 6 }}>
              <strong>{word}</strong>{" "}
              <button style={style("secure")} onClick={() => setWord(word, "secure")}>
                Secure
              </button>
              <button
                style={style("developing")}
                onClick={() => setWord(word, "developing")}
              >
                Developing
              </button>
              <button style={style("unknown")} onClick={() => setWord(word, "unknown")}>
                Unknown
              </button>
            </div>
          );
        })}

        <button onClick={saveAssessment} style={{ marginTop: 10 }}>
          Save assessment
        </button>
      </Card>

      {/* GRAPH */}
      <Card title="Progress Graph">
        {student.history.length === 0 ? (
          <p>No data yet</p>
        ) : (
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="id" />
                <YAxis />
                <Tooltip />
                <Line dataKey="secure" stroke="green" />
                <Line dataKey="developing" stroke="orange" />
                <Line dataKey="unknown" stroke="red" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    </div>
  );
}

