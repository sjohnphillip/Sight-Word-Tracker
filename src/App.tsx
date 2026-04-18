import React, { useEffect, useMemo, useState } from "react";
import {
  Copy,
  Download,
  LineChart as LineChartIcon,
  Plus,
  Printer,
  Search as SearchIcon,
  Table2,
  Trash2,
  Zap,
} from "lucide-react";

type MasteryLevel = "secure" | "developing" | "unknown";
type BulkLevel = MasteryLevel | "reset";
type SortMode = "az" | "most" | "least";
type PracticeMode = "automatic" | "selected";
type AutoPracticeStrategy =
  | "priority_fix"
  | "confidence_builder"
  | "targeted_intervention";
type ProgressBasis = "all" | "through_section" | "custom_range";

type HistoryEntry = {
  date: string;
  knownCount: number;
  totalCount: number;
  secureCount: number;
  developingCount: number;
  unknownCount: number;
};

type Student = {
  id: string;
  name: string;
  known: Record<string, Record<string, boolean>>;
  mastery: Record<string, Record<string, MasteryLevel>>;
  history: HistoryEntry[];
  selectedPracticeWords: string[];
};

const STORAGE_KEY = "fry_sight_word_tracker_complete_v4";

const fryLists: Record<string, string[]> = {
  "1st 100":
    "a about all an and are as at be been but by called can come could day did do down each find first for from get go had has have he her him his how I if in into is it like long look made make many may more my no not now number of oil on one or other out part people said see she sit so some than that the their them then there these they this time to two up use was water way we were what when which who will with words would write you your".split(
      " "
    ),
  "2nd 100":
    "after again air also America animal another answer any around ask away back because before big boy came change different does end even follow form found give good great hand help here home house just kind know land large learn letter line little live man me means men most mother move much must name need new off old only our over page picture place play point put read right same say sentence set should show small sound spell still study such take tell things think three through too try turn us very want well went where why work world years".split(
      " "
    ),
  "3rd 100":
    "above add almost along always began begin being below between book both car carry children city close country cut don’t earth eat enough every example eyes face family far father feet few food four girl got group grow hard head hear high idea important Indian it’s keep last late leave left let life light list might mile miss mountains near never next night often once open own paper plant real river run saw school sea second seem side something sometimes song soon start state stop story talk those thought together took tree under until walk watch while white without young".split(
      " "
    ),
  "4th 100":
    "across against area become best better birds black body certain cold color complete covered cried didn’t dog door draw during early easy ever fall farm fast field figure fire fish five friends ground happened heard himself hold horse hours however hundred I’ll king knew listen low map mark measure money morning music north notice numeral order passed pattern piece plan problem products pulled questions reached red remember rock room seen several ship short since sing slowly south space stand step sun sure table today told top toward town travel true unit upon usually voice vowel war waves whole wind wood".split(
      " "
    ),
  "5th 100":
    "able ago am among ball base became behind boat box bring brought building built cannot carefully check circle class clear common contain correct course dark decided deep done dry English equation explain fact feel filled finally fine fly force front full game gave government green half heat heavy hot inches include inside island known language less machine material minutes note nothing noun object ocean oh pair person plane power produce quickly ran rest road round rule scientists shape shown six size special stars stay stood street strong surface system ten though thousands understand verb wait warm week wheels yes yet".split(
      " "
    ),
  "6th 100":
    "anything arms beautiful believe beside bill blue brother can’t cause cells center clothes dance describe developed difference direction discovered distance divided drive drop edge eggs energy Europe exercise farmers felt finished flowers forest general gone grass happy heart held instruments interest job kept lay legs length love main matter meet members million mind months moon paint paragraph past perhaps picked present probably race rain raised ready reason record region represent return root sat shall sign simple site sky soft square store subject suddenly sum summer syllables teacher test third train wall weather west whether wide wild window winter wish written".split(
      " "
    ),
  "7th 100":
    "act Africa age already although amount angle appear baby bear beat bed bottom bright broken build buy care case cat century consonant copy couldn’t count cross dictionary died dress either everyone everything exactly factors fight fingers floor fraction free French gold hair hill hole hope ice instead iron jumped killed lake laughed lead let’s lot melody metal method middle milk moment nation natural outside per phrase poor possible pounds pushed quiet quite remain result ride rolled sail scale section sleep smiled snow soil solve someone son speak speed spring stone surprise tall temperature themselves tiny trip type village within wonder".split(
      " "
    ),
  "8th 100":
    "alone art bad bank bit break brown burning business captain catch caught cents child choose clean climbed cloud coast continued control cool cost decimal desert design direct drawing ears east else engine England equal experiment express feeling fell flow foot garden gas glass God grew history human hunting increase information itself joined key lady law least lost maybe mouth party pay period plains please practice president received report ring rise row save seeds sent separate serve shouted single skin statement stick straight strange students suppose symbols team touch trouble uncle valley visit wear whose wire woman wrote yard you’re yourself".split(
      " "
    ),
  "9th 100":
    "addition army bell belong block blood blow board bones branches cattle chief compare compound consider cook corner crops crowd current doctor dollars eight electric elements enjoy entered except exciting expect famous fit flat fruit fun guess hat hit indicate industry insects interesting Japanese lie lifted loud major mall meat mine modern movement necessary observe park particular planets poem pole position process property provide rather rhythm rich safe sand science sell send sense seven sharp shoulder sight silent soldiers spot spread stream string suggested supply swim terms thick thin thus tied tone trade tube value wash wasn’t weight wife wings won’t".split(
      " "
    ),
  "10th 100":
    "action actually adjective afraid agreed ahead allow apple arrived born bought British capital chance chart church column company conditions corn cotton cows create dead deal death details determine difficult division doesn’t effect entire especially evening experience factories fair fear fig forward France fresh Greek gun hoe huge isn’t led level located march match molecules northern nose office opposite oxygen plural prepared pretty printed radio repeated rope rose score seat settled shoes shop similar sir sister smell solution southern steel stretched substances suffix sugar tools total track triangle truck underline various view Washington we’ll western win women workers wouldn’t wrong yellow".split(
      " "
    ),
};

const SECTIONS = Object.keys(fryLists);

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function createStudent(): Student {
  return {
    id: crypto.randomUUID(),
    name: "",
    known: {},
    mastery: {},
    history: [],
    selectedPracticeWords: [],
  };
}

function countKnown(student?: Student, allowedWords?: Set<string>) {
  if (!student) return 0;
  return Object.values(student.known)
    .flatMap((section) => Object.entries(section || {}))
    .filter(([word, value]) => Boolean(value) && (!allowedWords || allowedWords.has(word)))
    .length;
}

function countByMastery(
  student: Student | undefined,
  allowedWords: Set<string>,
  level: MasteryLevel
) {
  if (!student) return 0;
  let count = 0;
  for (const section of Object.values(student.mastery || {})) {
    for (const [word, mastery] of Object.entries(section || {})) {
      if (allowedWords.has(word) && mastery === level) count += 1;
    }
  }
  return count;
}

function countUnknown(student: Student | undefined, words: string[]) {
  if (!student) return words.length;
  let count = 0;
  for (const word of words) {
    const isKnown = Object.values(student.known || {}).some((section) => section[word]);
    if (!isKnown) count += 1;
  }
  return count;
}

function getWordsThroughSection(section: string) {
  const index = SECTIONS.indexOf(section);
  return index === -1 ? [] : SECTIONS.slice(0, index + 1).flatMap((name) => fryLists[name]);
}

function getWordsThroughCount(sectionCount: number) {
  const safeCount = Math.max(1, Math.min(sectionCount, SECTIONS.length));
  return SECTIONS.slice(0, safeCount).flatMap((name) => fryLists[name]);
}

function safeFilename(name: string, suffix: string) {
  const cleaned = (name || "student").trim().toLowerCase().replace(/\s+/g, "_");
  return `${cleaned}${suffix}`;
}

function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function Card({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={className}>{children}</div>;
}

function CardHeader({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={className}>{children}</div>;
}

function CardTitle({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <h3 className={className}>{children}</h3>;
}

function CardContent({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={className}>{children}</div>;
}

function Button({
  variant = "default",
  className = "",
  children,
  type = "button",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline";
}) {
  const styles =
    variant === "outline"
      ? "border border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
      : "border border-slate-900 bg-slate-900 text-white hover:bg-slate-800";

  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap transition-colors disabled:pointer-events-none disabled:opacity-50",
        styles,
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className = "", ...rest } = props;
  return (
    <input
      {...rest}
      className={cn("border border-slate-200 bg-white px-3 outline-none", className)}
    />
  );
}

function Badge({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700",
        className
      )}
    >
      {children}
    </span>
  );
}

function ScrollArea({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("overflow-auto", className)}>{children}</div>;
}

function openClassSummaryWindow(
  teacherName: string,
  studentsForWindow: Array<{
    id: string;
    name: string;
    known: Student["known"];
    mastery: Student["mastery"];
  }>,
  progressWords: string[],
  progressWordSet: Set<string>,
  progressTotal: number
) {
  const namedStudents = studentsForWindow.filter((s) => (s.name || "").trim());

  const rows = namedStudents
    .map((student) => {
      const fakeStudent: Student = {
        id: student.id,
        name: student.name,
        known: student.known,
        mastery: student.mastery,
        history: [],
        selectedPracticeWords: [],
      };

      const known = countKnown(fakeStudent, progressWordSet);
      const secure = countByMastery(fakeStudent, progressWordSet, "secure");
      const developing = countByMastery(fakeStudent, progressWordSet, "developing");
      const unknown = countUnknown(fakeStudent, progressWords);
      const percent = progressTotal ? Math.round((known / progressTotal) * 100) : 0;

      return `
        <tr>
          <td>${student.name}</td>
          <td>${known}</td>
          <td>${secure}</td>
          <td>${developing}</td>
          <td>${unknown}</td>
          <td>${percent}%</td>
        </tr>
      `;
    })
    .join("");

  const studentCount = namedStudents.length;
  const avgProgress =
    studentCount === 0
      ? 0
      : Math.round(
          namedStudents.reduce((sum, student) => {
            const fakeStudent: Student = {
              id: student.id,
              name: student.name,
              known: student.known,
              mastery: student.mastery,
              history: [],
              selectedPracticeWords: [],
            };
            const known = countKnown(fakeStudent, progressWordSet);
            return sum + (progressTotal ? (known / progressTotal) * 100 : 0);
          }, 0) / studentCount
        );

  const totalKnownAcrossClass = namedStudents.reduce((sum, student) => {
    const fakeStudent: Student = {
      id: student.id,
      name: student.name,
      known: student.known,
      mastery: student.mastery,
      history: [],
      selectedPracticeWords: [],
    };
    return sum + countKnown(fakeStudent, progressWordSet);
  }, 0);

  const win = window.open("", "_blank", "width=1200,height=800");
  if (!win) return;

  win.document.open();
  win.document.write(`<!doctype html>
<html>
<head>
  <title>Class Summary Sheet</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 24px;
      background: #f8fafc;
      color: #0f172a;
    }
    .shell { max-width: 1180px; margin: 0 auto; }
    .card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 24px;
      padding: 24px;
      box-shadow: 0 1px 2px rgba(15,23,42,0.04);
    }
    h1 { margin: 0 0 8px 0; font-size: 34px; }
    .sub { margin: 0 0 16px 0; color: #475569; }
    .meta {
      display: grid;
      grid-template-columns: repeat(3, minmax(180px, 1fr));
      gap: 12px;
      margin-bottom: 20px;
    }
    .pill {
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 12px 14px;
      background: #f8fafc;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
      margin-top: 10px;
    }
    thead th {
      background: #f8fafc;
      font-weight: 700;
      text-align: left;
    }
    th, td {
      border: 1px solid #e2e8f0;
      padding: 10px 12px;
    }
    tbody tr:nth-child(even) { background: #fafafa; }
    .actions {
      margin-top: 20px;
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }
    button {
      height: 42px;
      padding: 0 16px;
      border-radius: 14px;
      border: 1px solid #cbd5e1;
      background: white;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
    }
    button:hover { background: #f8fafc; }
  </style>
</head>
<body>
  <div class="shell">
    <div class="card">
      <h1>Class Summary Sheet</h1>
      <p class="sub">Whole-class summary for secure, developing, unknown, total known, and overall progress.</p>

      <div class="meta">
        <div class="pill"><strong>Teacher:</strong> ${teacherName || ""}</div>
        <div class="pill"><strong>Students:</strong> ${studentCount}</div>
        <div class="pill"><strong>Average progress:</strong> ${avgProgress}%</div>
      </div>

      <div class="meta" style="grid-template-columns: repeat(2, minmax(180px, 1fr));">
        <div class="pill"><strong>Total known across class:</strong> ${totalKnownAcrossClass}</div>
        <div class="pill"><strong>Words tracked per student:</strong> ${progressTotal}</div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Student</th>
            <th>Total Known</th>
            <th>Secure</th>
            <th>Developing</th>
            <th>Unknown</th>
            <th>Progress</th>
          </tr>
        </thead>
        <tbody>
          ${rows || `<tr><td colspan="6">No named students yet.</td></tr>`}
        </tbody>
      </table>

      <div class="actions">
        <button onclick="window.print()">Print</button>
        <button onclick="window.close()">Close</button>
      </div>
    </div>
  </div>
</body>
</html>`);
  win.document.close();
}

function openStudentProgressGraphWindow(student: Student, progressTotal: number) {
  if (!student.history.length) {
    window.alert("No saved assessments yet for this student.");
    return;
  }

  const labels = student.history.map((item) => item.date);
  const secure = student.history.map((item) => item.secureCount);
  const developing = student.history.map((item) => item.developingCount);
  const unknown = student.history.map((item) => item.unknownCount);

  const win = window.open("", "_blank", "width=1100,height=760");
  if (!win) return;

  win.document.open();
  win.document.write(`<!doctype html>
<html>
<head>
  <title>Progress Graph - ${student.name || "Student"}</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 24px;
      background: #f8fafc;
      color: #0f172a;
    }
    .shell { max-width: 1000px; margin: 0 auto; }
    .card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 24px;
      padding: 24px;
      box-shadow: 0 1px 2px rgba(15,23,42,0.04);
    }
    h1 { margin: 0 0 8px 0; font-size: 34px; }
    p { margin: 0 0 8px 0; color: #475569; }
    .meta {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 12px;
      margin: 20px 0 24px 0;
    }
    .pill {
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 12px 14px;
      background: #f8fafc;
    }
    canvas {
      width: 100% !important;
      height: 420px !important;
    }
    .actions {
      margin-top: 20px;
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }
    button {
      height: 42px;
      padding: 0 16px;
      border-radius: 14px;
      border: 1px solid #cbd5e1;
      background: white;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
    }
    button:hover { background: #f8fafc; }
  </style>
</head>
<body>
  <div class="shell">
    <div class="card">
      <h1>Progress Graph</h1>
      <p>Student summary of secure, developing, and unknown words across saved assessments.</p>

      <div class="meta">
        <div class="pill"><strong>Student:</strong> ${student.name || "Student"}</div>
        <div class="pill"><strong>Assessments saved:</strong> ${student.history.length}</div>
        <div class="pill"><strong>Words tracked:</strong> ${progressTotal}</div>
      </div>

      <canvas id="progressChart"></canvas>

      <div class="actions">
        <button onclick="window.print()">Print</button>
        <button onclick="window.close()">Close</button>
      </div>
    </div>
  </div>

  <script>
    const ctx = document.getElementById('progressChart');
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: ${JSON.stringify(labels)},
        datasets: [
          {
            label: 'Secure',
            data: ${JSON.stringify(secure)},
            borderColor: '#22c55e',
            backgroundColor: 'rgba(34,197,94,0.15)',
            tension: 0.25,
            fill: false,
            borderWidth: 3,
            pointRadius: 4
          },
          {
            label: 'Developing',
            data: ${JSON.stringify(developing)},
            borderColor: '#fb923c',
            backgroundColor: 'rgba(251,146,60,0.15)',
            tension: 0.25,
            fill: false,
            borderWidth: 3,
            pointRadius: 4
          },
          {
            label: 'Unknown',
            data: ${JSON.stringify(unknown)},
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239,68,68,0.15)',
            tension: 0.25,
            fill: false,
            borderWidth: 3,
            pointRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top' },
          tooltip: { mode: 'index', intersect: false }
        },
        interaction: {
          mode: 'nearest',
          axis: 'x',
          intersect: false
        },
        scales: {
          y: {
            beginAtZero: true,
            suggestedMax: ${progressTotal},
            ticks: { precision: 0 }
          }
        }
      }
    });
  </script>
</body>
</html>`);
  win.document.close();
}

export default function App() {
  const [teacherName, setTeacherName] = useState("");
  const [students, setStudents] = useState<Student[]>([createStudent()]);
  const [selectedId, setSelectedId] = useState("");
  const [activeSection, setActiveSection] = useState(SECTIONS[0]);
  const [search, setSearch] = useState("");
  const [quickMode, setQuickMode] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("az");
  const [quickIndex, setQuickIndex] = useState(0);

  const [practiceMode, setPracticeMode] = useState<PracticeMode>("automatic");
  const [autoPracticeStrategy, setAutoPracticeStrategy] =
    useState<AutoPracticeStrategy>("targeted_intervention");
  const [practiceCount, setPracticeCount] = useState<10 | 20>(20);

  const [progressBasis, setProgressBasis] = useState<ProgressBasis>("all");
  const [customProgressSections, setCustomProgressSections] = useState(1);

  const [showPracticePreview, setShowPracticePreview] = useState(false);
  const [showReportPreview, setShowReportPreview] = useState(false);
  const [showEndReportPreview, setShowEndReportPreview] = useState(false);

  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);

      if (typeof parsed.teacherName === "string") setTeacherName(parsed.teacherName);
      if (Array.isArray(parsed.students) && parsed.students.length) setStudents(parsed.students);
      if (typeof parsed.selectedId === "string") setSelectedId(parsed.selectedId);
      if (typeof parsed.activeSection === "string" && SECTIONS.includes(parsed.activeSection)) {
        setActiveSection(parsed.activeSection);
      }
      if (typeof parsed.search === "string") setSearch(parsed.search);
      if (typeof parsed.quickMode === "boolean") setQuickMode(parsed.quickMode);
      if (["az", "most", "least"].includes(parsed.sortMode)) setSortMode(parsed.sortMode);
      if (typeof parsed.quickIndex === "number") setQuickIndex(parsed.quickIndex);
      if (["automatic", "selected"].includes(parsed.practiceMode)) setPracticeMode(parsed.practiceMode);
      if (
        ["priority_fix", "confidence_builder", "targeted_intervention"].includes(
          parsed.autoPracticeStrategy
        )
      ) {
        setAutoPracticeStrategy(parsed.autoPracticeStrategy);
      }
      if ([10, 20].includes(parsed.practiceCount)) setPracticeCount(parsed.practiceCount);
      if (["all", "through_section", "custom_range"].includes(parsed.progressBasis)) {
        setProgressBasis(parsed.progressBasis);
      }
      if (typeof parsed.customProgressSections === "number") {
        setCustomProgressSections(parsed.customProgressSections);
      }
      if (typeof parsed.showPracticePreview === "boolean") setShowPracticePreview(parsed.showPracticePreview);
      if (typeof parsed.showReportPreview === "boolean") setShowReportPreview(parsed.showReportPreview);
      if (typeof parsed.showEndReportPreview === "boolean") setShowEndReportPreview(parsed.showEndReportPreview);
      if (typeof parsed.statusMessage === "string") setStatusMessage(parsed.statusMessage);
    } catch (error) {
      console.error("Failed to load tracker data", error);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        teacherName,
        students,
        selectedId,
        activeSection,
        search,
        quickMode,
        sortMode,
        quickIndex,
        practiceMode,
        autoPracticeStrategy,
        practiceCount,
        progressBasis,
        customProgressSections,
        showPracticePreview,
        showReportPreview,
        showEndReportPreview,
        statusMessage,
      })
    );
  }, [
    teacherName,
    students,
    selectedId,
    activeSection,
    search,
    quickMode,
    sortMode,
    quickIndex,
    practiceMode,
    autoPracticeStrategy,
    practiceCount,
    progressBasis,
    customProgressSections,
    showPracticePreview,
    showReportPreview,
    showEndReportPreview,
    statusMessage,
  ]);

  useEffect(() => {
    if (!students.some((s) => s.id === selectedId) && students[0]) {
      setSelectedId(students[0].id);
    }
  }, [selectedId, students]);

  const student = students.find((s) => s.id === selectedId);
  const allWords = useMemo(() => SECTIONS.flatMap((section) => fryLists[section]), []);

  const filteredWords = useMemo(() => {
    const base = fryLists[activeSection] || [];
    const q = search.trim().toLowerCase();
    return q ? base.filter((word) => word.toLowerCase().startsWith(q)) : base;
  }, [activeSection, search]);

  const progressWords = useMemo(() => {
    if (progressBasis === "through_section") return getWordsThroughSection(activeSection);
    if (progressBasis === "custom_range") return getWordsThroughCount(customProgressSections);
    return allWords;
  }, [activeSection, customProgressSections, progressBasis, allWords]);

  const progressWordSet = useMemo(() => new Set(progressWords), [progressWords]);
  const progressKnownCount = student ? countKnown(student, progressWordSet) : 0;
  const progressTotal = progressWords.length || 1;
  const progressPercent = student ? Math.round((progressKnownCount / progressTotal) * 100) : 0;

  const studentNumberMap = useMemo(() => {
    const map = new Map<string, number>();
    students.forEach((s, i) => map.set(s.id, i + 1));
    return map;
  }, [students]);

  const knownWordsForProgress = useMemo(() => {
    if (!student) return [];
    return progressWords.filter((word) =>
      Object.values(student.known || {}).some((section) => section[word])
    );
  }, [student, progressWords]);

  const workingOnWordsForProgress = useMemo(() => {
    if (!student) return [];
    return progressWords.filter(
      (word) => !Object.values(student.known || {}).some((section) => section[word])
    );
  }, [student, progressWords]);

  const sortedStudents = useMemo(() => {
    const copy = [...students];
    if (sortMode === "az") {
      return copy.sort((a, b) => {
        const aName = (a.name || "").trim();
        const bName = (b.name || "").trim();
        if (!aName && !bName) {
          return (studentNumberMap.get(a.id) || 0) - (studentNumberMap.get(b.id) || 0);
        }
        if (!aName) return 1;
        if (!bName) return -1;
        return aName.localeCompare(bName);
      });
    }
    if (sortMode === "most") {
      return copy.sort((a, b) => countKnown(b, progressWordSet) - countKnown(a, progressWordSet));
    }
    return copy.sort((a, b) => countKnown(a, progressWordSet) - countKnown(b, progressWordSet));
  }, [students, sortMode, progressWordSet, studentNumberMap]);

  const updateStudent = (updates: Partial<Student>) => {
    if (!student) return;
    setStudents((prev) => prev.map((s) => (s.id === student.id ? { ...s, ...updates } : s)));
  };

  const deleteCurrentStudent = () => {
    if (!student) return;
    const label = student.name?.trim() || "this student";
    const confirmed = window.confirm(`Are you sure you want to delete ${label}?`);
    if (!confirmed) return;

    if (students.length === 1) {
      const replacement = createStudent();
      setStudents([replacement]);
      setSelectedId(replacement.id);
      setStatusMessage("Student deleted.");
      return;
    }

    const currentIndex = students.findIndex((s) => s.id === student.id);
    const remaining = students.filter((s) => s.id !== student.id);
    const nextStudent = remaining[currentIndex] || remaining[currentIndex - 1] || remaining[0];

    setStudents(remaining);
    setSelectedId(nextStudent.id);
    setStatusMessage("Student deleted.");
  };

  const setMastery = (word: string, section: string, level: MasteryLevel) => {
    if (!student) return;

    updateStudent({
      mastery: {
        ...student.mastery,
        [section]: {
          ...(student.mastery[section] || {}),
          [word]: level,
        },
      },
      known: {
        ...student.known,
        [section]: {
          ...(student.known[section] || {}),
          [word]: level !== "unknown",
        },
      },
    });
  };

  const toggleWord = (word: string, section: string) => {
    if (!student) return;
    const next = !student.known?.[section]?.[word];
    setMastery(word, section, next ? "secure" : "unknown");
  };

  const togglePracticeWord = (word: string) => {
    if (!student) return;
    const current = student.selectedPracticeWords || [];
    updateStudent({
      selectedPracticeWords: current.includes(word)
        ? current.filter((w) => w !== word)
        : [...current, word],
    });
  };

  const markWholeSection = (section: string, level: BulkLevel) => {
    if (!student) return;

    const label =
      level === "secure"
        ? "Secure"
        : level === "developing"
        ? "Developing"
        : level === "unknown"
        ? "Unknown"
        : "neutral";

    const confirmed = window.confirm(
      level === "reset"
        ? `Are you sure you want to reset all words in ${section}?`
        : `Are you sure you want to mark all words in ${section} as ${label}?`
    );
    if (!confirmed) return;

    const words = fryLists[section] || [];
    const newMastery = { ...(student.mastery || {}) };
    const newKnown = { ...(student.known || {}) };

    newMastery[section] = { ...(newMastery[section] || {}) };
    newKnown[section] = { ...(newKnown[section] || {}) };

    words.forEach((word) => {
      if (level === "reset") {
        delete newMastery[section][word];
        delete newKnown[section][word];
      } else {
        newMastery[section][word] = level;
        newKnown[section][word] = level !== "unknown";
      }
    });

    updateStudent({ mastery: newMastery, known: newKnown });
    setStatusMessage(
      level === "reset"
        ? `All words in ${section} reset to neutral.`
        : `All words in ${section} marked as ${label}.`
    );
  };

  const promoteUnknownToDeveloping = (section: string) => {
    if (!student) return;
    const confirmed = window.confirm(`Move all Unknown words in ${section} to Developing?`);
    if (!confirmed) return;

    const words = fryLists[section] || [];
    const newMastery = { ...(student.mastery || {}) };
    const newKnown = { ...(student.known || {}) };

    newMastery[section] = { ...(newMastery[section] || {}) };
    newKnown[section] = { ...(newKnown[section] || {}) };

    words.forEach((word) => {
      const current = newMastery[section][word];
      if (!current || current === "unknown") {
        newMastery[section][word] = "developing";
        newKnown[section][word] = true;
      }
    });

    updateStudent({ mastery: newMastery, known: newKnown });
    setStatusMessage(`Unknown words in ${section} moved to Developing.`);
  };

  const promoteDevelopingToSecure = (section: string) => {
    if (!student) return;
    const confirmed = window.confirm(`Move all Developing words in ${section} to Secure?`);
    if (!confirmed) return;

    const words = fryLists[section] || [];
    const newMastery = { ...(student.mastery || {}) };
    const newKnown = { ...(student.known || {}) };

    newMastery[section] = { ...(newMastery[section] || {}) };
    newKnown[section] = { ...(newKnown[section] || {}) };

    words.forEach((word) => {
      if (newMastery[section][word] === "developing") {
        newMastery[section][word] = "secure";
        newKnown[section][word] = true;
      }
    });

    updateStudent({ mastery: newMastery, known: newKnown });
    setStatusMessage(`Developing words in ${section} moved to Secure.`);
  };

  const getPracticeWords = () => {
    if (!student) return [] as string[];

    if (practiceMode === "selected") {
      return (student.selectedPracticeWords || []).slice(0, practiceCount);
    }

    const isKnown = (word: string) =>
      Object.values(student.known || {}).some((section) => section[word]);

    const getMasteryForWord = (word: string): MasteryLevel | undefined => {
      for (const sectionName of SECTIONS) {
        const value = student.mastery?.[sectionName]?.[word];
        if (value) return value;
      }
      return undefined;
    };

    const unknownWords = progressWords.filter((word) => !isKnown(word));
    const developingWords = progressWords.filter(
      (word) => getMasteryForWord(word) === "developing"
    );

    if (autoPracticeStrategy === "priority_fix") {
      return [
        ...unknownWords,
        ...developingWords.filter((word) => !unknownWords.includes(word)),
      ].slice(0, practiceCount);
    }

    if (autoPracticeStrategy === "confidence_builder") {
      const unknownTarget = Math.round(practiceCount * 0.4);
      const developingTarget = practiceCount - unknownTarget;

      const chosenUnknown = unknownWords.slice(0, unknownTarget);
      const chosenDeveloping = developingWords
        .filter((word) => !chosenUnknown.includes(word))
        .slice(0, developingTarget);

      const extras = [...unknownWords, ...developingWords].filter(
        (word) => !chosenUnknown.includes(word) && !chosenDeveloping.includes(word)
      );

      return [...chosenUnknown, ...chosenDeveloping, ...extras].slice(0, practiceCount);
    }

    const currentSectionWords = (fryLists[activeSection] || []).filter((word) =>
      progressWordSet.has(word)
    );

    const currentSectionIndex = SECTIONS.indexOf(activeSection);
    const earlierSectionWords = SECTIONS.slice(0, currentSectionIndex)
      .flatMap((sectionName) => fryLists[sectionName] || [])
      .filter((word) => progressWordSet.has(word));

    const unknownCurrent = currentSectionWords.filter((word) => !isKnown(word));
    const unknownEarlier = earlierSectionWords.filter((word) => !isKnown(word));
    const targetedDeveloping = progressWords.filter(
      (word) =>
        !unknownCurrent.includes(word) &&
        !unknownEarlier.includes(word) &&
        getMasteryForWord(word) === "developing"
    );

    return [...unknownCurrent, ...unknownEarlier, ...targetedDeveloping].slice(
      0,
      practiceCount
    );
  };

  const saveAssessment = () => {
    if (!student) return;

    const secureCount = countByMastery(student, progressWordSet, "secure");
    const developingCount = countByMastery(student, progressWordSet, "developing");
    const unknownCount = countUnknown(student, progressWords);

    updateStudent({
      history: [
        ...student.history,
        {
          date: new Date().toLocaleDateString(),
          knownCount: progressKnownCount,
          totalCount: progressTotal,
          secureCount,
          developingCount,
          unknownCount,
        },
      ],
    });

    setStatusMessage("Assessment saved.");
  };

  const nextQuickWord = (correct: boolean) => {
    const word = allWords[quickIndex];
    const section = SECTIONS.find((name) => fryLists[name].includes(word)) || SECTIONS[0];
    setMastery(word, section, correct ? "secure" : "unknown");
    setQuickIndex((prev) => (prev + 1) % allWords.length);
  };

  const buildReportText = () => {
    if (!student) return "";
    return [
      "Sight Word Progress Report",
      "",
      `Student: ${student.name || "Student"}`,
      `Teacher: ${teacherName || ""}`,
      `Words known: ${progressKnownCount} / ${progressTotal}`,
      `Progress basis: ${
        progressBasis === "through_section"
          ? `up to ${activeSection}`
          : progressBasis === "custom_range"
          ? `first ${customProgressSections * 100} words`
          : "all Fry lists"
      }`,
      "",
      "Words to Practise",
      getPracticeWords().length ? getPracticeWords().join(", ") : "No words selected yet.",
    ].join("\n");
  };

  const buildEndReportText = () => {
    if (!student) return "";
    return [
      "End Report",
      "",
      `Student: ${student.name || "Student"}`,
      `Teacher: ${teacherName || ""}`,
      `Words known: ${progressKnownCount} / ${progressTotal}`,
      "",
      "Well done! You can read these words:",
      knownWordsForProgress.length ? knownWordsForProgress.join(", ") : "No words recorded yet.",
      "",
      "These words you should keep working on:",
      workingOnWordsForProgress.length
        ? workingOnWordsForProgress.join(", ")
        : "None at the moment.",
    ].join("\n");
  };

  const downloadPracticeList = () => {
    if (!student) return;
    downloadTextFile(
      safeFilename(student.name, "_practice_list.txt"),
      getPracticeWords().join(", ") || "No words selected yet."
    );
    setStatusMessage("Practice list downloaded.");
  };

  const copyPracticeList = async () => {
    try {
      await navigator.clipboard.writeText(
        getPracticeWords().join(", ") || "No words selected yet."
      );
      setStatusMessage("Practice list copied to clipboard.");
    } catch {
      setStatusMessage("Clipboard copy was blocked by the browser.");
    }
  };

  const downloadReportText = () => {
    if (!student) return;
    downloadTextFile(safeFilename(student.name, "_parent_report.txt"), buildReportText());
    setStatusMessage("Parent report downloaded.");
  };

  const exportStudentDataCSV = () => {
  if (!students.length) return;

  // Header row
  const headers = [
    "Student Number",
    "Student Name",
    "Total Known",
    "Secure",
    "Developing",
    "Unknown",
    "Progress (%)"
  ];

  const rows = students.map((s, index) => {
    const known = countKnown(s, progressWordSet);
    const secure = countByMastery(s, progressWordSet, "secure");
    const developing = countByMastery(s, progressWordSet, "developing");
    const unknown = countUnknown(s, progressWords);
    const percent = progressTotal
      ? Math.round((known / progressTotal) * 100)
      : 0;

    return [
      index + 1,
      s.name || `Student ${index + 1}`,
      known,
      secure,
      developing,
      unknown,
      percent
    ];
  });

  const csvContent =
    [headers, ...rows]
      .map((row) => row.join(","))
      .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "class_student_data.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
  const copyReportText = async () => {
    try {
      await navigator.clipboard.writeText(buildReportText());
      setStatusMessage("Parent report copied to clipboard.");
    } catch {
      setStatusMessage("Clipboard copy was blocked by the browser.");
    }
  };

  const downloadEndReportText = () => {
    if (!student) return;
    downloadTextFile(safeFilename(student.name, "_end_report.txt"), buildEndReportText());
    setStatusMessage("End Report downloaded.");
  };

  const copyEndReportText = async () => {
    try {
      await navigator.clipboard.writeText(buildEndReportText());
      setStatusMessage("End Report copied to clipboard.");
    } catch {
      setStatusMessage("Clipboard copy was blocked by the browser.");
    }
  };

  const handleOpenClassSummary = () => {
    const numberedStudents = sortedStudents.map((s) => ({
      id: s.id,
      name: s.name?.trim() ? `${studentNumberMap.get(s.id)}. ${s.name}` : "",
      known: s.known,
      mastery: s.mastery,
    }));

    openClassSummaryWindow(
      teacherName,
      numberedStudents,
      progressWords,
      progressWordSet,
      progressTotal
    );
  };

  const handleOpenGraph = () => {
    if (!student) return;
    openStudentProgressGraphWindow(student, progressTotal);
  };

  const openParentReportPrintWindow = () => {
    const practiceWordsText = getPracticeWords().length
      ? getPracticeWords().join(", ")
      : "No words selected yet.";

    const win = window.open("", "_blank", "width=950,height=760");
    if (!win) return;

    win.document.open();
    win.document.write(`<!doctype html>
<html>
<head>
  <title>Parent Report</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 24px;
      background: #f8fafc;
      color: #0f172a;
    }
    .page {
      max-width: 900px;
      margin: 0 auto;
      background: white;
      border: 1px solid #dbe4ea;
      position: relative;
      overflow: hidden;
    }
    .pattern {
      height: 70px;
      background:
        radial-gradient(circle at 20px 20px, #b9d7da 2px, transparent 3px),
        radial-gradient(circle at 60px 35px, #c7e1e3 2px, transparent 3px),
        linear-gradient(135deg, #eef7f8 25%, #f8fcfc 25%, #f8fcfc 50%, #eef7f8 50%, #eef7f8 75%, #f8fcfc 75%, #f8fcfc 100%);
      background-size: 40px 40px;
      border-bottom: 1px solid #dbe4ea;
    }
    .inner {
      padding: 28px 34px 34px 34px;
    }
    .title {
      margin: 0;
      font-size: 44px;
      letter-spacing: 2px;
      color: #4ea3aa;
      font-weight: 800;
    }
    .subtitle {
      margin: 10px 0 22px 0;
      font-size: 18px;
      font-weight: 800;
      color: #222;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 22px 24px;
      margin-bottom: 26px;
    }
    .field {
      border: 3px solid #5aaeb4;
      min-height: 56px;
      padding: 10px 14px;
      box-sizing: border-box;
    }
    .field-label {
      font-weight: 800;
      font-size: 14px;
      margin-bottom: 6px;
      color: #222;
    }
    .field-value {
      font-size: 15px;
      color: #222;
      word-break: break-word;
    }
    .box {
      border: 3px solid #5aaeb4;
      min-height: 170px;
      padding: 14px;
      box-sizing: border-box;
      margin-bottom: 12px;
    }
    .box-title {
      font-size: 15px;
      color: #333;
      margin-bottom: 12px;
    }
    .box-text {
      font-size: 15px;
      line-height: 1.6;
      color: #222;
      white-space: pre-wrap;
      word-break: break-word;
    }
    .bar {
      background: #72b8bd;
      color: #222;
      text-align: center;
      font-weight: 800;
      letter-spacing: 1px;
      padding: 8px 10px;
      margin-bottom: 8px;
      font-size: 14px;
    }
    .practice-area {
      border: 3px solid #5aaeb4;
      min-height: 280px;
      padding: 14px;
      box-sizing: border-box;
      background:
        linear-gradient(to bottom, transparent 31px, #e8f2f3 32px);
      background-size: 100% 32px;
    }
    .actions {
      display: flex;
      gap: 10px;
      margin-top: 20px;
    }
    button {
      height: 42px;
      padding: 0 16px;
      border-radius: 14px;
      border: 1px solid #cbd5e1;
      background: white;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
    }
    @media print {
      body {
        background: white;
        padding: 0;
      }
      .page {
        border: none;
      }
      .actions {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="pattern"></div>
    <div class="inner">
      <h1 class="title">SIGHT WORD RECORD</h1>
      <div class="subtitle">PROGRESS REPORT</div>

      <div class="grid">
        <div class="field">
          <div class="field-label">Student:</div>
          <div class="field-value">${student.name || "Student"}</div>
        </div>

        <div class="field">
          <div class="field-label">Teacher:</div>
          <div class="field-value">${teacherName || ""}</div>
        </div>

        <div class="field">
          <div class="field-label">Words Known:</div>
          <div class="field-value">${progressKnownCount} / ${progressTotal}</div>
        </div>

        <div class="field">
          <div class="field-label">Progress Basis:</div>
          <div class="field-value">${
            progressBasis === "through_section"
              ? `Up to ${activeSection}`
              : progressBasis === "custom_range"
              ? `First ${customProgressSections * 100} words`
              : "All Fry lists"
          }</div>
        </div>
      </div>

      <div class="box">
        <div class="box-title">You're doing great! Please practise these words.</div>
        <div class="box-text">${practiceWordsText}</div>
      </div>

      <div class="bar">You can practise here</div>

      <div class="practice-area"></div>

      <div class="actions">
        <button onclick="window.print()">Print</button>
        <button onclick="window.close()">Close</button>
      </div>
    </div>
  </div>
</body>
</html>`);
    win.document.close();
  };

  const openEndReportPrintWindow = () => {
    const readWordsText = knownWordsForProgress.length
      ? knownWordsForProgress.join(", ")
      : "No words recorded yet.";

    const keepWorkingText = workingOnWordsForProgress.length
      ? workingOnWordsForProgress.join(", ")
      : "None at the moment.";

    const win = window.open("", "_blank", "width=950,height=800");
    if (!win) return;

    win.document.open();
    win.document.write(`<!doctype html>
<html>
<head>
  <title>End Report</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 24px;
      background: #f8fafc;
      color: #0f172a;
    }
    .page {
      max-width: 900px;
      margin: 0 auto;
      background: white;
      border: 1px solid #dbe4ea;
      position: relative;
      overflow: hidden;
    }
    .pattern {
      height: 60px;
      background:
        linear-gradient(90deg,
          #c7d8ea 0 5%,
          #89a6c5 5% 10%,
          #c7d8ea 10% 15%,
          #89a6c5 15% 20%,
          #c7d8ea 20% 25%,
          #89a6c5 25% 30%,
          #c7d8ea 30% 35%,
          #89a6c5 35% 40%,
          #c7d8ea 40% 45%,
          #89a6c5 45% 50%,
          #c7d8ea 50% 55%,
          #89a6c5 55% 60%,
          #c7d8ea 60% 65%,
          #89a6c5 65% 70%,
          #c7d8ea 70% 75%,
          #89a6c5 75% 80%,
          #c7d8ea 80% 85%,
          #89a6c5 85% 90%,
          #c7d8ea 90% 95%,
          #89a6c5 95% 100%);
    }
    .bottom-pattern {
      height: 48px;
      margin-top: 22px;
      background:
        linear-gradient(90deg,
          #c7d8ea 0 5%,
          #89a6c5 5% 10%,
          #c7d8ea 10% 15%,
          #89a6c5 15% 20%,
          #c7d8ea 20% 25%,
          #89a6c5 25% 30%,
          #c7d8ea 30% 35%,
          #89a6c5 35% 40%,
          #c7d8ea 40% 45%,
          #89a6c5 45% 50%,
          #c7d8ea 50% 55%,
          #89a6c5 55% 60%,
          #c7d8ea 60% 65%,
          #89a6c5 65% 70%,
          #c7d8ea 70% 75%,
          #89a6c5 75% 80%,
          #c7d8ea 80% 85%,
          #89a6c5 85% 90%,
          #c7d8ea 90% 95%,
          #89a6c5 95% 100%);
    }
    .inner {
      padding: 18px 34px 0 34px;
      position: relative;
    }
    .top-label {
      margin: 0;
      font-size: 18px;
      font-weight: 800;
      color: #222;
      letter-spacing: 0.5px;
    }
    .title {
      margin: 8px 0 14px 0;
      font-size: 58px;
      line-height: 1;
      letter-spacing: 2px;
      color: #4ea3aa;
      font-weight: 800;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px 24px;
      margin-bottom: 12px;
    }
    .field {
      border: 3px solid #5aaeb4;
      min-height: 48px;
      padding: 8px 12px;
      box-sizing: border-box;
    }
    .field-label {
      font-weight: 800;
      font-size: 12px;
      margin-bottom: 4px;
      color: #333;
    }
    .field-value {
      font-size: 14px;
      color: #222;
      word-break: break-word;
    }
    .big-box {
      border: 3px solid #5aaeb4;
      min-height: 340px;
      padding: 10px 12px;
      box-sizing: border-box;
      margin-top: 10px;
    }
    .big-box-title {
      font-size: 15px;
      font-weight: 800;
      color: #333;
      margin-bottom: 12px;
    }
    .big-box-text {
      font-size: 15px;
      line-height: 1.6;
      color: #222;
      white-space: pre-wrap;
      word-break: break-word;
    }
    .lower-box {
      border: 3px solid #5aaeb4;
      min-height: 250px;
      padding: 14px 12px 12px 12px;
      box-sizing: border-box;
      margin-top: 14px;
      position: relative;
    }
    .lower-label {
      display: inline-block;
      background: #9fc8cd;
      color: #222;
      font-weight: 800;
      letter-spacing: 2px;
      padding: 4px 8px;
      font-size: 12px;
      margin-bottom: 12px;
    }
    .lower-text {
      font-size: 15px;
      line-height: 1.6;
      color: #222;
      white-space: pre-wrap;
      word-break: break-word;
      max-width: 78%;
    }
    .stamp {
      position: absolute;
      right: 14px;
      bottom: 12px;
      width: 150px;
      height: 150px;
      border: 4px solid #7b9098;
      border-radius: 999px;
      color: #596d75;
      transform: rotate(-12deg);
      opacity: 0.9;
      box-sizing: border-box;
    }
    .stamp::before {
      content: "";
      position: absolute;
      inset: 10px;
      border: 3px solid #7b9098;
      border-radius: 999px;
    }
    .stamp-banner {
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%) rotate(-2deg);
      border: 4px solid #7b9098;
      background: white;
      padding: 4px 12px;
      font-size: 22px;
      font-weight: 800;
      letter-spacing: 1px;
      white-space: nowrap;
    }
    .actions {
      display: flex;
      gap: 10px;
      margin: 18px 34px 24px 34px;
    }
    button {
      height: 42px;
      padding: 0 16px;
      border-radius: 14px;
      border: 1px solid #cbd5e1;
      background: white;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
    }
    @media print {
      body {
        background: white;
        padding: 0;
      }
      .page {
        border: none;
      }
      .actions {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="pattern"></div>
    <div class="inner">
      <p class="top-label">END REPORT</p>
      <h1 class="title">SPELLING RECORD</h1>

      <div class="grid">
        <div class="field">
          <div class="field-label">Student:</div>
          <div class="field-value">${student.name || "Student"}</div>
        </div>

        <div class="field">
          <div class="field-label">Teacher:</div>
          <div class="field-value">${teacherName || ""}</div>
        </div>

        <div class="field">
          <div class="field-label">Words Known:</div>
          <div class="field-value">${progressKnownCount} / ${progressTotal}</div>
        </div>

        <div class="field">
          <div class="field-label">Progress Basis:</div>
          <div class="field-value">${
            progressBasis === "through_section"
              ? `Up to ${activeSection}`
              : progressBasis === "custom_range"
              ? `First ${customProgressSections * 100} words`
              : "All Fry lists"
          }</div>
        </div>
      </div>

      <div class="big-box">
        <div class="big-box-title">Well done! You can read these words:</div>
        <div class="big-box-text">${readWordsText}</div>
      </div>

      <div class="lower-box">
        <div class="lower-label">You can keep working on these words for now.</div>
        <div class="lower-text">${keepWorkingText}</div>

        <div class="stamp">
          <div class="stamp-banner">Well done!</div>
        </div>
      </div>
    </div>

    <div class="bottom-pattern"></div>

    <div class="actions">
      <button onclick="window.print()">Print</button>
      <button onclick="window.close()">Close</button>
    </div>
  </div>
</body>
</html>`);
    win.document.close();
  };

  if (!student) {
    return <div className="p-4">Select a student</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-4 md:px-6 md:py-6">
      <div className="mx-auto max-w-[1600px] space-y-5">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm md:p-7">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="pr-2">
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
  Sight Word Tracker
</h1>
<p className="mt-2 text-sm text-slate-500 md:text-base">
  Clear tracking for real reading progress.
</p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
              <Button onClick={() => setQuickMode((v) => !v)} className="h-11 rounded-2xl px-5">
                <Zap className="mr-2 h-4 w-4" />
                {quickMode ? "Grid" : "Quick Assess"}
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  setShowPracticePreview(true);
                  setShowReportPreview(false);
                  setShowEndReportPreview(false);
                }}
                className="h-11 rounded-2xl px-5"
              >
                <Download className="mr-2 h-4 w-4" />
                Practice List
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  setShowReportPreview(true);
                  setShowPracticePreview(false);
                  setShowEndReportPreview(false);
                }}
                className="h-11 rounded-2xl px-5"
              >
                <Printer className="mr-2 h-4 w-4" />
                Parent report
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  setShowEndReportPreview(true);
                  setShowPracticePreview(false);
                  setShowReportPreview(false);
                  setStatusMessage("");
                }}
                className="h-11 rounded-2xl px-5"
              >
                End Report
              </Button>
            </div>
          </div>
        </div>

        <Card className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
          <CardContent className="p-5 md:p-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
              <div className="min-w-0">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Teacher name
                </label>
                <Input
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  className="h-11 w-full rounded-2xl text-base"
                />
              </div>

              <div className="min-w-0">
                <label className="mb-2 block text-sm font-medium text-slate-700">Student</label>
                <select
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                  className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-base"
                >
                  {students.map((s, i) => (
                    <option key={s.id} value={s.id}>
                      {`Student ${i + 1}`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="min-w-0">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Student name
                </label>
                <Input
                  value={student.name}
                  onChange={(e) => updateStudent({ name: e.target.value })}
                  className="h-11 w-full rounded-2xl text-base"
                />
              </div>

              <div className="min-w-0">
                <label className="mb-2 block text-sm font-medium text-slate-700">Search</label>
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-11 w-full rounded-2xl pl-9 text-base"
                  />
                </div>
              </div>

              <div className="min-w-0">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Progress basis
                </label>
                <select
                  value={progressBasis}
                  onChange={(e) => setProgressBasis(e.target.value as ProgressBasis)}
                  className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm"
                >
                  <option value="all">All words (1–1000)</option>
                  <option value="through_section">Up to this level</option>
                  <option value="custom_range">Choose a word range</option>
                </select>
              </div>

              {progressBasis === "custom_range" ? (
                <div className="min-w-0">
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Custom range
                  </label>
                  <select
                    value={customProgressSections}
                    onChange={(e) => setCustomProgressSections(Number(e.target.value))}
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm"
                  >
                    {SECTIONS.map((section, index) => (
                      <option key={section} value={index + 1}>
                        {`First ${(index + 1) * 100} words`}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="min-w-0" />
              )}

              <div className="flex items-end gap-3 xl:col-span-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    const next = createStudent();
                    setStudents([...students, next]);
                    setSelectedId(next.id);
                  }}
                  className="h-11 min-w-[110px] rounded-2xl px-4"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add
                </Button>

                <Button
                  variant="outline"
                  onClick={deleteCurrentStudent}
                  className="h-11 min-w-[110px] rounded-2xl px-4"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>

                <select
                  value={sortMode}
                  onChange={(e) => setSortMode(e.target.value as SortMode)}
                  className="h-11 min-w-[140px] rounded-2xl border border-slate-200 bg-white px-3 text-sm"
                >
                  <option value="az">A-Z</option>
                  <option value="most">Most known</option>
                  <option value="least">Least known</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)_360px]">
          <div className="space-y-5">
            <Card className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
              <CardHeader className="p-5 pb-0">
                <CardTitle className="text-[28px] font-semibold text-slate-900">
                  Progress overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-5">
                <div className="rounded-3xl bg-gradient-to-br from-slate-50 to-white p-5 ring-1 ring-slate-200">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-slate-900">Overall progress</span>
                    <Badge>
                      {progressKnownCount}/{progressTotal}
                    </Badge>
                  </div>
                  <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-slate-900 to-slate-700"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <p className="mt-3 text-sm text-slate-600">{progressPercent}% complete</p>
                </div>

                <Button
                  variant="outline"
                  className="h-11 w-full rounded-2xl"
                  onClick={saveAssessment}
                >
                  Save assessment
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
              <CardHeader className="p-5 pb-0">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <CardTitle className="text-[28px] font-semibold text-slate-900">
                    Class overview
                  </CardTitle>
                  <div className="flex flex-wrap gap-2">
  <Button
    variant="outline"
    className="h-10 rounded-xl px-4"
    onClick={handleOpenClassSummary}
  >
    <Table2 className="mr-2 h-4 w-4" />
    Open Class Summary
  </Button>

  <Button
    variant="outline"
    className="h-10 rounded-xl px-4"
    onClick={exportStudentDataCSV}
  >
    <Download className="mr-2 h-4 w-4" />
    Export CSV
  </Button>
</div>
                </div>
              </CardHeader>
              <CardContent className="p-5">
                <div className="grid gap-3">
                  {sortedStudents
                    .filter((s) => (s.name || "").trim())
                    .map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setSelectedId(s.id)}
                        className="rounded-3xl border border-slate-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-semibold">
                            {`${studentNumberMap.get(s.id)}. ${s.name}`}
                          </h3>
                          <Badge>
                            {countKnown(s, progressWordSet)}/{progressTotal}
                          </Badge>
                        </div>
                      </button>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <CardHeader className="p-5 pb-0">
              <CardTitle className="text-[28px] font-semibold text-slate-900">
                Assessment screen
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              {quickMode ? (
                <div className="rounded-3xl border bg-slate-50 p-10 text-center">
                  <p className="mb-3 text-sm text-slate-500">Quick Assess Mode</p>
                  <h2 className="mb-8 text-5xl font-bold">{allWords[quickIndex]}</h2>
                  <div className="flex justify-center gap-3">
                    <Button className="h-12 rounded-2xl px-6" onClick={() => nextQuickWord(true)}>
                      Correct
                    </Button>
                    <Button
                      variant="outline"
                      className="h-12 rounded-2xl px-6"
                      onClick={() => nextQuickWord(false)}
                    >
                      Incorrect
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <ScrollArea className="w-full whitespace-nowrap pb-3">
                    <div className="inline-flex gap-3">
                      {SECTIONS.map((section) => {
                        const isActive = activeSection === section;
                        return (
                          <button
                            key={section}
                            type="button"
                            onClick={() => setActiveSection(section)}
                            className={`h-11 rounded-2xl border px-5 text-sm font-medium inline-flex items-center justify-center gap-2 ${
                              isActive
                                ? "border-slate-700 bg-white text-slate-900 shadow-sm"
                                : "border-slate-200 bg-white text-slate-700"
                            }`}
                          >
                            <span>{section}</span>
                            {isActive ? (
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                                Current
                              </span>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  </ScrollArea>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <Button
                      variant="outline"
                      className="h-10 rounded-xl px-4"
                      onClick={() => markWholeSection(activeSection, "secure")}
                    >
                      Mark all Secure
                    </Button>

                    <Button
                      variant="outline"
                      className="h-10 rounded-xl px-4"
                      onClick={() => markWholeSection(activeSection, "developing")}
                    >
                      Mark all Developing
                    </Button>

                    <Button
                      variant="outline"
                      className="h-10 rounded-xl px-4"
                      onClick={() => markWholeSection(activeSection, "unknown")}
                    >
                      Mark all Unknown
                    </Button>

                    <Button
                      variant="outline"
                      className="h-10 rounded-xl px-4"
                      onClick={() => markWholeSection(activeSection, "reset")}
                    >
                      Reset section
                    </Button>

                    <Button
                      variant="outline"
                      className="h-10 rounded-xl px-4"
                      onClick={() => promoteUnknownToDeveloping(activeSection)}
                    >
                      Unknown → Developing
                    </Button>

                    <Button
                      variant="outline"
                      className="h-10 rounded-xl px-4"
                      onClick={() => promoteDevelopingToSecure(activeSection)}
                    >
                      Developing → Secure
                    </Button>
                  </div>

                  <div className="mt-5">
                    <ScrollArea className="h-[560px] pr-3">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
                        {filteredWords.map((word) => {
                          const section = activeSection;
                          const mastery = student.mastery?.[section]?.[word];
                          const inPracticeList = (student.selectedPracticeWords || []).includes(word);

                          return (
                            <div
                              key={word}
                              className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
                            >
                              <button
                                onClick={() => toggleWord(word, section)}
                                className="min-h-[88px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-5 text-left text-[28px] font-semibold text-slate-800"
                              >
                                {word}
                              </button>

                              <div className="mt-4 flex flex-wrap gap-2">
                                <button
                                  onClick={() => setMastery(word, section, "secure")}
                                  className={`min-w-[96px] flex-1 rounded-2xl border px-3 py-3 text-center text-sm leading-tight transition-colors duration-150 ${
                                    mastery === "secure"
                                      ? "border-green-500 bg-green-500 text-white"
                                      : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                                  }`}
                                >
                                  Secure
                                </button>

                                <button
                                  onClick={() => setMastery(word, section, "developing")}
                                  className={`min-w-[120px] flex-1 rounded-2xl border px-3 py-3 text-center text-sm leading-tight transition-colors duration-150 ${
                                    mastery === "developing"
                                      ? "border-orange-400 bg-orange-400 text-white"
                                      : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                                  }`}
                                >
                                  Developing
                                </button>

                                <button
                                  onClick={() => setMastery(word, section, "unknown")}
                                  className={`min-w-[110px] flex-1 rounded-2xl border px-3 py-3 text-center text-sm leading-tight transition-colors duration-150 ${
                                    mastery === "unknown"
                                      ? "border-red-500 bg-red-500 text-white"
                                      : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                                  }`}
                                >
                                  Unknown
                                </button>
                              </div>

                              <button
                                onClick={() => togglePracticeWord(word)}
                                className={`mt-4 w-full rounded-2xl border px-4 py-3 text-sm transition ${
                                  inPracticeList
                                    ? "border-slate-900 bg-slate-900 text-white"
                                    : "border-slate-300 bg-slate-50 text-slate-700"
                                }`}
                              >
                                {inPracticeList
                                  ? "Remove from practice list"
                                  : "Add to practice list"}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-5">
            <Card className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
              <CardHeader className="p-5 pb-0">
                <CardTitle className="text-[28px] font-semibold text-slate-900">
                  Home Practice List
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-5">
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={practiceMode}
                    onChange={(e) => setPracticeMode(e.target.value as PracticeMode)}
                    className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm"
                  >
                    <option value="automatic">Auto (smart)</option>
                    <option value="selected">My chosen words</option>
                  </select>

                  <select
                    value={practiceCount}
                    onChange={(e) => setPracticeCount(Number(e.target.value) as 10 | 20)}
                    className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm"
                  >
                    <option value={10}>Top 10</option>
                    <option value={20}>Top 20</option>
                  </select>
                </div>

                {practiceMode === "automatic" ? (
                  <select
                    value={autoPracticeStrategy}
                    onChange={(e) =>
                      setAutoPracticeStrategy(e.target.value as AutoPracticeStrategy)
                    }
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm"
                  >
                    <option value="targeted_intervention">Targeted intervention</option>
                    <option value="priority_fix">Priority fix</option>
                    <option value="confidence_builder">Confidence builder</option>
                  </select>
                ) : null}

                <p className="text-sm leading-7 text-slate-700">
                  {getPracticeWords().length
                    ? getPracticeWords().join(", ")
                    : "No words selected yet."}
                </p>
              </CardContent>
            </Card>

            {statusMessage ? (
              <Card className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
                <CardHeader className="p-5 pb-0">
                  <CardTitle className="text-[28px] font-semibold text-slate-900">
                    Latest action
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5">
                  <p className="text-sm text-slate-700">{statusMessage}</p>
                </CardContent>
              </Card>
            ) : null}

            {showPracticePreview ? (
              <Card className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
                <CardHeader className="p-5 pb-0">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <CardTitle className="text-[28px] font-semibold text-slate-900">
                      Practice list preview
                    </CardTitle>
                    <div className="flex flex-wrap gap-2">
                      <Button onClick={downloadPracticeList} className="h-10 rounded-xl px-4">
                        <Download className="mr-2 h-4 w-4" /> Download
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => void copyPracticeList()}
                        className="h-10 rounded-xl px-4"
                      >
                        <Copy className="mr-2 h-4 w-4" /> Copy
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 p-5">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-7 text-slate-700">
                    {getPracticeWords().length
                      ? getPracticeWords().join(", ")
                      : "No words selected yet."}
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {showReportPreview ? (
              <Card className="rounded-[28px] border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div
                  className="h-[72px] border-b border-slate-200"
                  style={{
                    background:
                      "radial-gradient(circle at 20px 20px, #b9d7da 2px, transparent 3px), radial-gradient(circle at 60px 35px, #c7e1e3 2px, transparent 3px), linear-gradient(135deg, #eef7f8 25%, #f8fcfc 25%, #f8fcfc 50%, #eef7f8 50%, #eef7f8 75%, #f8fcfc 75%, #f8fcfc 100%)",
                    backgroundSize: "40px 40px",
                  }}
                />
                <CardContent className="p-6 md:p-8">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h2 className="text-4xl font-extrabold tracking-[0.12em] text-[#4ea3aa]">
                        SIGHT WORD RECORD
                      </h2>
                      <p className="mt-2 text-lg font-extrabold text-slate-800">
                        PROGRESS REPORT
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        onClick={openParentReportPrintWindow}
                        className="h-10 rounded-xl px-4"
                      >
                        <Printer className="mr-2 h-4 w-4" /> Print
                      </Button>
                      <Button
                        variant="outline"
                        onClick={downloadReportText}
                        className="h-10 rounded-xl px-4"
                      >
                        <Download className="mr-2 h-4 w-4" /> Download
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => void copyReportText()}
                        className="h-10 rounded-xl px-4"
                      >
                        <Copy className="mr-2 h-4 w-4" /> Copy
                      </Button>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-5 md:grid-cols-2">
                    <div className="min-h-[64px] border-[3px] border-[#5aaeb4] p-3">
                      <div className="mb-1 text-sm font-extrabold text-slate-800">Student:</div>
                      <div className="text-sm text-slate-800">{student.name || "Student"}</div>
                    </div>

                    <div className="min-h-[64px] border-[3px] border-[#5aaeb4] p-3">
                      <div className="mb-1 text-sm font-extrabold text-slate-800">Teacher:</div>
                      <div className="text-sm text-slate-800">{teacherName || ""}</div>
                    </div>

                    <div className="min-h-[64px] border-[3px] border-[#5aaeb4] p-3">
                      <div className="mb-1 text-sm font-extrabold text-slate-800">
                        Words Known:
                      </div>
                      <div className="text-sm text-slate-800">
                        {progressKnownCount} / {progressTotal}
                      </div>
                    </div>

                    <div className="min-h-[64px] border-[3px] border-[#5aaeb4] p-3">
                      <div className="mb-1 text-sm font-extrabold text-slate-800">
                        Progress Basis:
                      </div>
                      <div className="text-sm text-slate-800">
                        {progressBasis === "through_section"
                          ? `Up to ${activeSection}`
                          : progressBasis === "custom_range"
                          ? `First ${customProgressSections * 100} words`
                          : "All Fry lists"}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 min-h-[180px] border-[3px] border-[#5aaeb4] p-4">
                    <p className="mb-3 text-sm text-slate-700">
                      You're doing great! Please practise these words.
                    </p>
                    <p className="text-sm leading-7 text-slate-800">
                      {getPracticeWords().length
                        ? getPracticeWords().join(", ")
                        : "No words selected yet."}
                    </p>
                  </div>

                  <div className="mt-3 bg-[#72b8bd] px-4 py-2 text-center text-sm font-extrabold tracking-[0.12em] text-slate-800">
                    You can practise here
                  </div>

                  <div
                    className="min-h-[300px] border-[3px] border-[#5aaeb4] p-4"
                    style={{
                      backgroundImage:
                        "linear-gradient(to bottom, transparent 31px, #e8f2f3 32px)",
                      backgroundSize: "100% 32px",
                    }}
                  />
                </CardContent>
              </Card>
            ) : null}

            {showEndReportPreview ? (
              <Card className="rounded-[28px] border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div
                  className="h-[60px]"
                  style={{
                    background:
                      "linear-gradient(90deg, #c7d8ea 0 5%, #89a6c5 5% 10%, #c7d8ea 10% 15%, #89a6c5 15% 20%, #c7d8ea 20% 25%, #89a6c5 25% 30%, #c7d8ea 30% 35%, #89a6c5 35% 40%, #c7d8ea 40% 45%, #89a6c5 45% 50%, #c7d8ea 50% 55%, #89a6c5 55% 60%, #c7d8ea 60% 65%, #89a6c5 65% 70%, #c7d8ea 70% 75%, #89a6c5 75% 80%, #c7d8ea 80% 85%, #89a6c5 85% 90%, #c7d8ea 90% 95%, #89a6c5 95% 100%)",
                  }}
                />
                <CardContent className="p-5 md:p-8">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-[18px] font-extrabold tracking-[0.03em] text-slate-800">
                        END REPORT
                      </p>
                      <h2 className="mt-2 text-[52px] font-extrabold leading-none tracking-[0.06em] text-[#4ea3aa] md:text-[58px]">
                        SPELLING RECORD
                      </h2>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        onClick={openEndReportPrintWindow}
                        className="h-10 rounded-xl px-4"
                      >
                        <Printer className="mr-2 h-4 w-4" /> Print
                      </Button>

                      <Button
                        variant="outline"
                        onClick={downloadEndReportText}
                        className="h-10 rounded-xl px-4"
                      >
                        <Download className="mr-2 h-4 w-4" /> Download
                      </Button>

                      <Button
                        variant="outline"
                        onClick={() => void copyEndReportText()}
                        className="h-10 rounded-xl px-4"
                      >
                        <Copy className="mr-2 h-4 w-4" /> Copy
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2 md:gap-x-6">
                    <div className="min-h-[52px] border-[3px] border-[#5aaeb4] p-3">
                      <div className="mb-1 text-xs font-extrabold text-slate-700">Student:</div>
                      <div className="text-sm text-slate-800">{student.name || "Student"}</div>
                    </div>

                    <div className="min-h-[52px] border-[3px] border-[#5aaeb4] p-3">
                      <div className="mb-1 text-xs font-extrabold text-slate-700">Teacher:</div>
                      <div className="text-sm text-slate-800">{teacherName || ""}</div>
                    </div>

                    <div className="min-h-[52px] border-[3px] border-[#5aaeb4] p-3">
                      <div className="mb-1 text-xs font-extrabold text-slate-700">Words Known:</div>
                      <div className="text-sm text-slate-800">
                        {progressKnownCount} / {progressTotal}
                      </div>
                    </div>

                    <div className="min-h-[52px] border-[3px] border-[#5aaeb4] p-3">
                      <div className="mb-1 text-xs font-extrabold text-slate-700">
                        Progress Basis:
                      </div>
                      <div className="text-sm text-slate-800">
                        {progressBasis === "through_section"
                          ? `Up to ${activeSection}`
                          : progressBasis === "custom_range"
                          ? `First ${customProgressSections * 100} words`
                          : "All Fry lists"}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 min-h-[340px] border-[3px] border-[#5aaeb4] p-3">
                    <p className="mb-3 text-[15px] font-extrabold text-slate-700">
                      Well done! You can read these words:
                    </p>
                    <p className="text-sm leading-7 text-slate-800">
                      {knownWordsForProgress.length
                        ? knownWordsForProgress.join(", ")
                        : "No words recorded yet."}
                    </p>
                  </div>

                  <div className="relative mt-4 min-h-[250px] border-[3px] border-[#5aaeb4] p-3">
                    <div className="mb-3 inline-block bg-[#9fc8cd] px-3 py-1 text-xs font-extrabold tracking-[0.2em] text-slate-800">
                      You can keep working on these words for now.
                    </div>

                    <p className="max-w-[78%] text-sm leading-7 text-slate-800">
                      {workingOnWordsForProgress.length
                        ? workingOnWordsForProgress.join(", ")
                        : "None at the moment."}
                    </p>

                    <div className="absolute bottom-3 right-4 h-[150px] w-[150px] rotate-[-12deg] rounded-full border-4 border-slate-500 opacity-80">
                      <div className="absolute inset-[10px] rounded-full border-[3px] border-slate-500" />
                      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-2deg] whitespace-nowrap border-4 border-slate-500 bg-white px-3 py-1 text-[22px] font-extrabold text-slate-600">
                        Well done!
                      </div>
                    </div>
                  </div>
                </CardContent>

                <div
                  className="h-[48px]"
                  style={{
                    background:
                      "linear-gradient(90deg, #c7d8ea 0 5%, #89a6c5 5% 10%, #c7d8ea 10% 15%, #89a6c5 15% 20%, #c7d8ea 20% 25%, #89a6c5 25% 30%, #c7d8ea 30% 35%, #89a6c5 35% 40%, #c7d8ea 40% 45%, #89a6c5 45% 50%, #c7d8ea 50% 55%, #89a6c5 55% 60%, #c7d8ea 60% 65%, #89a6c5 65% 70%, #c7d8ea 70% 75%, #89a6c5 75% 80%, #c7d8ea 80% 85%, #89a6c5 85% 90%, #c7d8ea 90% 95%, #89a6c5 95% 100%)",
                  }}
                />
              </Card>
            ) : null}

            <Card className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
              <CardHeader className="p-5 pb-0">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <CardTitle className="text-[28px] font-semibold text-slate-900">
                    Assessment history
                  </CardTitle>

                  <Button
                    variant="outline"
                    className="h-10 rounded-xl px-4"
                    onClick={handleOpenGraph}
                  >
                    <LineChartIcon className="mr-2 h-4 w-4" />
                    Open Progress Graph
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-5">
                {student.history.length === 0 ? (
                  <p className="text-sm text-slate-500">No saved assessments yet.</p>
                ) : (
                  <div className="space-y-3">
                    {student.history.map((item, i) => (
                      <div key={i} className="rounded-2xl border border-slate-200 p-4 text-sm">
                        <strong>{item.date}</strong>
                        <div className="mt-2">Secure: {item.secureCount}</div>
                        <div>Developing: {item.developingCount}</div>
                        <div>Unknown: {item.unknownCount}</div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}