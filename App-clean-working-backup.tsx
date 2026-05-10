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
import { driver } from "driver.js";
// @ts-ignore
import "driver.js/dist/driver.css";

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
  studentNumber: number;
  known: Record<string, Record<string, boolean>>;
  mastery: Record<string, Record<string, MasteryLevel>>;
  history: HistoryEntry[];
  selectedPracticeWords: string[];
  isAddedToClass: boolean;
};

const STORAGE_KEY = "fry_sight_word_tracker_complete_v6";

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
    studentNumber: Date.now(), // unique stable number
    known: {},
    mastery: {},
    history: [],
    selectedPracticeWords: [],
    isAddedToClass: false,
  };
}

function countKnown(student?: Student, allowedWords?: Set<string>) {
  if (!student) return 0;

  return Object.values(student.mastery)
    .flatMap((section) => Object.entries(section || {}))
    .filter(([word, value]) => value === "secure" && (!allowedWords || allowedWords.has(word)))
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

function openHtmlWindow(title: string, html: string, width = 980, height = 820) {
  const win = window.open("", "_blank", `width=${width},height=${height}`);
  if (!win) return null;
  win.document.open();
  win.document.write(html);
  win.document.close();
  return win;
}

function buildPopupShell(title: string, bodyHtml: string, extraStyles = "") {
  return `<!doctype html>
<html>
<head>
  <title>${title}</title>
  <meta charset="utf-8" />
  <style>
    body {
      font-family: 'Comic Neue', cursive, Arial, sans-serif;
      margin: 0;
      padding: 24px;
      background: #f8fafc;
      color: #0f172a;
    }
    .page {
      max-width: 920px;
      margin: 0 auto;
      background: white;
      border: 1px solid #dbe4ea;
      overflow: hidden;
    }
    .actions {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      margin: 18px auto 0 auto;
      max-width: 920px;
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
    button:hover {
      background: #f8fafc;
    }
    @media print {
  @page {
    size: A4;
    margin: 6mm;
  }

  body {
    padding: 0;
  }

  .page {
    page-break-inside: avoid;
  }
}

  .page {
    width: 100%;
    max-width: 100%;
    margin: 0;
    padding: 8mm;
    border: none;
    box-sizing: border-box;
    transform: scale(0.92);
    transform-origin: top center;
  }

  .pattern {
    height: 28px;
    margin-bottom: 8px;
  }

  h1 {
    font-size: 26px;
    line-height: 1;
    margin-bottom: 4px;
  }

  .subtitle {
    font-size: 12px;
    margin: 4px 0 8px;
  }

  .details {
    gap: 8px;
    margin-bottom: 6px;
  }

  .field {
    min-height: 22px;
    padding: 5px 7px;
    font-size: 11px;
  }

  .word-box {
    min-height: 85px;
    padding: 7px;
    margin-bottom: 6px;
    font-size: 10px;
  }

  .words {
    font-size: 9px;
    line-height: 1.25;
  }

  .bar {
    padding: 4px;
    margin: 5px 0;
    font-size: 11px;
    letter-spacing: 2px;
  }

  .practice-title {
    font-size: 12px;
    margin: 4px 0;
  }

  .practice-grid {
    grid-template-columns: repeat(5, 1fr);
  }

  .cell {
    height: 40px;
  }

 .actions {
  margin-top: 10px;
}

@media print {
  .actions {
    display: none;
  }
}
    ${extraStyles}
  </style>
</head>
<body>
  <div class="page">
    ${bodyHtml}
  </div>

  <div class="actions">
    <button onclick="window.print()">Print</button>
    <button onclick="window.close()">Close</button>
  </div>
</body>
</html>`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
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

  const html = `<!doctype html>
<html>
<head>
  <title>Class Summary Sheet</title>
  <style>
    body {
      font-family: 'Comic Neue', cursive, Arial, sans-serif;
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
          ${rows || '<tr><td colspan="6">No named students yet.</td></tr>'}
        </tbody>
      </table>

      <div class="actions">
        <button onclick="window.print()">Print</button>
        <button onclick="window.close()">Close</button>
      </div>
    </div>
  </div>
</body>
</html>`;

  openHtmlWindow("Class Summary Sheet", html, 1200, 800);
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

  const html = `<!doctype html>
<html>
<head>
  <title>Progress Graph - ${student.name || "Student"}</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    body {
      font-family: 'Comic Neue', cursive, Arial, sans-serif;
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
</html>`;

  openHtmlWindow("Progress Graph", html, 1100, 760);
}

export default function App() {
  const [teacherName, setTeacherName] = useState("");
  const [students, setStudents] = useState<Student[]>([createStudent()]);
  const [selectedId, setSelectedId] = useState("");
  const [hasSelectedStudent, setHasSelectedStudent] = useState(false);
  const [activeSection, setActiveSection] = useState(SECTIONS[0]);
  const [search, setSearch] = useState("");
  const [quickMode, setQuickMode] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("az");
  const [quickIndex, setQuickIndex] = useState(0);
const [quickFeedback, setQuickFeedback] = useState<"secure" | "developing" | "unknown" | null>(null);
  const [hasRunTour, setHasRunTour] = useState(false);
  const [practiceMode, setPracticeMode] = useState<PracticeMode>("automatic");
  const [autoPracticeStrategy, setAutoPracticeStrategy] =
    useState<AutoPracticeStrategy>("targeted_intervention");
  const [practiceCount, setPracticeCount] = useState<10 | 20>(20);
  const [progressBasis, setProgressBasis] = useState<ProgressBasis>("all");
  const [customProgressSections, setCustomProgressSections] = useState(1);
  const [customStartSection, setCustomStartSection] = useState(SECTIONS[0]);
const [customEndSection, setCustomEndSection] = useState(SECTIONS[0]);
  const [statusMessage, setStatusMessage] = useState("");
  const [showStatusModal, setShowStatusModal] = useState(false);
const [draftStudentName, setDraftStudentName] = useState("");
  const [showReportPreview, setShowReportPreview] = useState(false);
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
      if (["az", "most", "least"].includes(parsed.sortMode)) {
        setSortMode(parsed.sortMode);
      }
      if (typeof parsed.quickIndex === "number") setQuickIndex(parsed.quickIndex);
      if (["automatic", "selected"].includes(parsed.practiceMode)) {
        setPracticeMode(parsed.practiceMode);
      }
      if (
        ["priority_fix", "confidence_builder", "targeted_intervention"].includes(
          parsed.autoPracticeStrategy
        )
      ) {
        setAutoPracticeStrategy(parsed.autoPracticeStrategy);
      }
      if ([10, 20].includes(parsed.practiceCount)) {
        setPracticeCount(parsed.practiceCount);
      }
      if (["all", "through_section", "custom_range"].includes(parsed.progressBasis)) {
        setProgressBasis(parsed.progressBasis);
      }
      if (typeof parsed.customProgressSections === "number") {
        setCustomProgressSections(parsed.customProgressSections);
      }
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
    statusMessage,
  ]);

  useEffect(() => {
    if (!students.some((s) => s.id === selectedId) && students[0]) {
      setSelectedId(students[0].id);
    }
  }, [selectedId, students]);

  useEffect(() => {
  const seenTour = localStorage.getItem("sight_word_tracker_tour_seen");

  if (seenTour) return;

  const timer = setTimeout(() => {
    const el = document.getElementById("tour-header");
    if (!el) return;

    startTour();
    localStorage.setItem("sight_word_tracker_tour_seen", "true");
  }, 1200);

  return () => clearTimeout(timer);
}, []);

  const student = students.find((s) => s.id === selectedId);
  const allWords = useMemo(() => SECTIONS.flatMap((section) => fryLists[section]), []);

  const filteredWords = useMemo(() => {
    const base = fryLists[activeSection] || [];
    const q = search.trim().toLowerCase();
    return q ? base.filter((word) => word.toLowerCase().startsWith(q)) : base;
  }, [activeSection, search]);

  const progressWords = useMemo(() => {
    if (progressBasis === "through_section") {
  return fryLists[activeSection] || [];
}
    if (progressBasis === "custom_range") {
  const startIndex = SECTIONS.indexOf(customStartSection);
  const endIndex = SECTIONS.indexOf(customEndSection);

  const from = Math.min(startIndex, endIndex);
  const to = Math.max(startIndex, endIndex);

  return SECTIONS.slice(from, to + 1).flatMap((section) => fryLists[section] || []);
}
    return allWords;
  }, [activeSection, customStartSection, customEndSection, progressBasis, allWords]);

  const progressWordSet = useMemo(() => new Set(progressWords), [progressWords]);
  const progressKnownCount = student ? countKnown(student, progressWordSet) : 0;
  const progressTotal = progressWords.length;
  const progressPercent = student && progressTotal > 0
  ? Math.round((progressKnownCount / progressTotal) * 100)
  : 0;

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
  setStudents([]);
  setSelectedId("");
  setHasSelectedStudent(false);
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
  if (students.length === 0 || !hasSelectedStudent) {
  setStatusMessage("Please select a student before tracking words.");
  setShowStatusModal(true);
  return;
}
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
    if (!student) {
  setStatusMessage("Please select a student before tracking words.");
  setShowStatusModal(true);
  return;
}
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

 const nextQuickWord = (status: "secure" | "developing" | "unknown") => {
  if (students.length === 0 || !hasSelectedStudent) {
  setStatusMessage("Please select a student before using Quick Assess.");
  setShowStatusModal(true);
  return;
}

  const word = allWords[quickIndex];
  const section =
    SECTIONS.find((name) => fryLists[name].includes(word)) || SECTIONS[0];

  setQuickFeedback(status);
  setMastery(word, section, status);

  setTimeout(() => {
    setQuickFeedback(null);
    setQuickIndex((prev) => (prev + 1) % allWords.length);
  }, 120);
};
useEffect(() => {
  if (!quickMode) return;

  const handleKeyDown = (event: any) => {
    const key = event.key.toLowerCase();

    if (key === "s") nextQuickWord("secure");
    if (key === "d") nextQuickWord("developing");
    if (key === "u") nextQuickWord("unknown");
  };

  window.addEventListener("keydown", handleKeyDown);

  return () => {
    window.removeEventListener("keydown", handleKeyDown);
  };
}, [quickMode, nextQuickWord]);
  const buildReportText = () => {
    if (!student) return "";
    return [
      "Sight Word Progress Report",
      "",
      `Student: ${student.name || "Student"}`,
      `Teacher: ${teacherName || ""}`,
      `Words known: ${progressKnownCount} / ${progressTotal}`,
      `Progress basis: ${getProgressBasisLabel()}`,
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

  const exportStudentDataCSV = () => {
    if (!students.length) return;

    const headers = [
      "Student Number",
      "Student Name",
      "Total Known",
      "Secure",
      "Developing",
      "Unknown",
      "Progress (%)",
    ];

    const rows = students.map((s, index) => {
      const known = countKnown(s, progressWordSet);
      const secure = countByMastery(s, progressWordSet, "secure");
      const developing = countByMastery(s, progressWordSet, "developing");
      const unknown = countUnknown(s, progressWords);
      const percent = progressTotal ? Math.round((known / progressTotal) * 100) : 0;

      return [index + 1, s.name || `Student ${index + 1}`, known, secure, developing, unknown, percent];
    });

    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "class_student_data.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  const openPracticeListPopup = () => {
  if (!student) return;

  const words = getPracticeWords();
const studentDisplayName = student.name || "Student";
  const teacherDisplayName = teacherName || "Teacher";

  const wordRows = words
    .map(
      (word, index) => `
        <div class="word-block">
          <div class="word-title">
            <span class="number">${index + 1}.</span>
            <span class="word">${String(word)}</span>
          </div>

          <div class="lines">
            <div class="line"></div>
            <div class="line"></div>
          </div>
        </div>
      `
    )
    .join("");

  const popup = window.open("", "_blank", "width=850,height=1100");
  if (!popup) return;

  popup.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Practice List</title>

        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
     <link href="https://fonts.googleapis.com/css2?family=Comic+Neue:wght@400;700&amp;display=swap" rel="stylesheet">   

        <style>
          body {
            margin: 0;
            padding: 20px;
            font-family: 'Comic Neue', cursive, Arial, sans-serif;
            color: #111827;
            background: white;
          }

          h1, .subheading {
            font-family: Arial, sans-serif;
            font-weight: bold;
            text-align: center;
          }

          h1 {
  margin: 0 0 4px 0;
  font-size: 22px;
}

          .subheading {
            margin-bottom: 12px;
            font-size: 14px;
          }

          .page {
  max-width: 800px;
  margin: 0 auto;
  border: 2px solid #111827;
  padding: 8px;
}

          .details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            font-size: 13px;
            margin-bottom: 12px;
          }

          .note {
            border: 1px solid #111827;
            padding: 8px;
            font-size: 13px;
            margin-bottom: 14px;
          }

          .word-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 18px;
}

          .word-block {
            page-break-inside: avoid;
          }

          .word-title {
            display: flex;
            gap: 6px;
            font-weight: bold;
            margin-bottom: 4px;
          }

          .lines {
            display: flex;
            flex-direction: column;
            gap: 6px;
          }

          .line {
  border-bottom: 2px solid #111827;
  height: 13px;
}

          .footer {
  margin-top: 6px;
  padding-top: 8px;
  font-size: 12px;
  text-align: center;
}

          .actions {
            margin-bottom: 10px;
          }

          button {
            padding: 6px 12px;
            margin-right: 6px;
            border: 1px solid #111827;
            background: white;
            cursor: pointer;
          }

          .tip {
            font-size: 12px;
            margin-bottom: 10px;
          }

          @media print {
            .actions, .tip {
              display: none;
            }

            body {
              padding: 0;
            }

            .page {
              border: 2px solid #111827;
            }
          }
        </style>
      </head>

      <body>

        <div class="actions">
          <button onclick="window.print()">Print</button>
          <button onclick="window.close()">Close</button>
        </div>

        <div class="tip">
          Tip: Turn off headers/footers for best results. This sheet is designed to print clearly even with background graphics off.
        </div>

        <div class="page">
          <h1>PRACTICE LIST</h1>
          <div class="subheading">SPELLINGS FOR HOME</div>

          <div class="details">
            <div><strong>Student:</strong> ${studentDisplayName}</div>
            <div><strong>Teacher:</strong> ${teacherDisplayName}</div>
            <div><strong>Date:</strong> ${new Date().toLocaleDateString()}</div>
            <div><strong>Words:</strong> ${words.length}</div>
          </div>

          <div class="note">
            Practise reading and writing each word. Read, Say, Cover, Write and Check.
          </div>

          <div class="word-list">
            ${wordRows}
          </div>

          <div class="footer">
            A little practice every day builds strong readers.
          </div>
        </div>

      </body>
    </html>
  `);

  popup.document.close();
};
 

  const getProgressBasisLabel = () => {
  const suffix = (n: number) =>
    n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th";

  if (progressBasis === "all") {
    return "1000 words";
  }

  if (progressBasis === "through_section") {
    const sectionNumber = SECTIONS.indexOf(activeSection) + 1;
    return `${sectionNumber}${suffix(sectionNumber)} 100`;
  }

  if (progressBasis === "custom_range") {
    const startIndex = SECTIONS.indexOf(customStartSection);
    const endIndex = SECTIONS.indexOf(customEndSection);

    const from = Math.min(startIndex, endIndex) + 1;
    const to = Math.max(startIndex, endIndex) + 1;

    return `${from}${suffix(from)} 100 to ${to}${suffix(to)} 100 words`;
  }

  return "";
};        
  const openParentReportPopup = () => {
    if (!student) return;

    const practiceWordsText = getPracticeWords().length
      ? escapeHtml(getPracticeWords().join(", "))
      : "No words selected yet.";

    const basisText = getProgressBasisLabel();

    const body = `
      
      <div class="inner">
        <h1 class="title">SIGHT WORD RECORD</h1>
        <div class="subtitle">PROGRESS REPORT</div>

        <div class="grid">
          <div class="field">
            <div class="field-label">Student:</div>
            <div class="field-value">${escapeHtml(student.name || "Student")}</div>
          </div>

          <div class="field">
            <div class="field-label">Teacher:</div>
            <div class="field-value">${escapeHtml(teacherName || "")}</div>
          </div>

          <div class="field">
            <div class="field-label">Words Known:</div>
            <div class="field-value">${progressKnownCount} / ${progressTotal}</div>
          </div>

          <div class="field">
            <div class="field-label">Progress Basis:</div>
            <div class="field-value">${escapeHtml(basisText)}</div>
          </div>
        </div>

        <div class="report-box">
          <div class="box-title">You're doing great! Please practise these words.</div>
          <div class="box-text">${practiceWordsText}</div>
        </div>

        <div class="bar">You can practise here</div>
        <div class="practice-area"></div>
      </div>
    `;

    const styles = `
      .pattern {
        height: 70px;
        background:
          radial-gradient(circle at 20px 20px, #b9d7da 2px, transparent 3px),
          radial-gradient(circle at 60px 35px, #c7e1e3 2px, transparent 3px),
          linear-gradient(135deg, #eef7f8 25%, #f8fcfc 25%, #f8fcfc 50%, #eef7f8 50%, #eef7f8 75%, #f8fcfc 75%, #f8fcfc 100%);
        background-size: 40px 40px;
        border-bottom: 1px solid #dbe4ea;
      }
      .inner { padding: 28px 34px 34px 34px; }
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
      .report-box {
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
        font-weight: 700;
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
    `;

    openHtmlWindow(
      "Parent Report",
      buildPopupShell("Parent Report", body, styles),
      980,
      820
    );
  };

  const openEndReportPopup = () => {
    if (!student) return;

    const readWordsText = knownWordsForProgress.length
      ? escapeHtml(knownWordsForProgress.join(", "))
      : "No words recorded yet.";

    const keepWorkingText = workingOnWordsForProgress.length
      ? escapeHtml(workingOnWordsForProgress.join(", "))
      : "None at the moment.";

    const basisText = getProgressBasisLabel();

    const body = `
      
      <div class="inner">
        <p class="top-label">END REPORT</p>
        <h1 class="title">SPELLING RECORD</h1>

        <div class="grid">
          <div class="field">
            <div class="field-label">Student:</div>
            <div class="field-value">${escapeHtml(student.name || "Student")}</div>
          </div>

          <div class="field">
            <div class="field-label">Teacher:</div>
            <div class="field-value">${escapeHtml(teacherName || "")}</div>
          </div>

          <div class="field">
            <div class="field-label">Words Known:</div>
            <div class="field-value">${progressKnownCount} / ${progressTotal}</div>
          </div>

          <div class="field">
            <div class="field-label">Words being learned:</div>
            <div class="field-value">${escapeHtml(basisText)}</div>
          </div>
        </div>

        <div class="big-box">
          <div class="big-box-title">Well done! You can read these words:</div>
          <div class="big-box-text">${readWordsText}</div>
        </div>

        <div class="lower-box">
          <div class="lower-label">You can keep working on these words for now.</div>
          <div class="lower-text">${keepWorkingText}</div>

          

     

    `;

    const styles = `
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
    `;

    openHtmlWindow(
      "End Report",
      buildPopupShell("End Report", body, styles),
      980,
      860
    );
  };
useEffect(() => {
  const seenTour = localStorage.getItem("sight_word_tracker_tour_seen");

  if (!seenTour) {
    const timer = setTimeout(() => {
      startTour();
    }, 800);

    return () => clearTimeout(timer);
  }
}, []);
const startTour = () => {
  const tour = driver({
    showProgress: true,
    allowClose: true,
    steps: [
      {
        popover: {
          title: "Welcome 👋",
          description: "This is your Sight Word Tracker.",
          side: "bottom",
          align: "center",
        },
      },
      {
        element: "#tour-student-controls",
        popover: {
          title: "Student Controls",
          description: "Add and manage students here.",
          side: "bottom",
          align: "start",
        },
      },
      {
        element: "#tour-save-assessment",
        popover: {
          title: "Save Progress",
          description: "Click here to save assessments.",
          side: "bottom",
          align: "start",
        },
      },
    ],
    onDestroyed: () => {
      localStorage.setItem("sight_word_tracker_tour_seen", "true");
    },
  });

  tour.drive();
};
  if (!student) {
    return <div className="p-4">Select a student</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-4 md:px-6 md:py-6">
      <div className="mx-auto max-w-[1600px] space-y-5">
        <div
          id="tour-header"
          className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm md:p-7"
        >
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="pr-2">
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                Sight Word Tracker
              </h1>
              <p className="mt-2 text-sm text-slate-500 md:text-base">
                Clear tracking for reading progress.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
             <Button
  onClick={() => setQuickMode((v) => !v)}
  className="h-11 px-4 w-full rounded-2xl sm:w-auto"
>
  {quickMode ? "Grid" : "Quick Assess"}
</Button>

              


<Button
  variant="outline"
  onClick={() => setShowReportPreview(true)}
  className="h-11 w-full rounded-2xl px-5 sm:w-auto"
>
  Progress Report
</Button>

              <Button
                variant="outline"
                onClick={openEndReportPopup}
                className="h-11 rounded-2xl px-5"
              >
                End Report
              </Button>

              <Button
                variant="outline"
                onClick={startTour}
                className="h-11 rounded-2xl px-5"
              >
                Help / Tour
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)_360px]">
          {/* LEFT */}
          <div className="space-y-5">
            <Card id="tour-student-controls" className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
              <CardHeader className="p-5 pb-0">
               <CardTitle className="text-[28px] font-semibold text-slate-900">
  Progress overview
</CardTitle>

<p className="text-sm text-slate-500 mt-1">
  {progressBasis === "all" && "Tracking: All 1000 words"}
  {progressBasis === "through_section" &&
    `Tracking: ${SECTIONS.indexOf(activeSection) + 1}${["st","nd","rd"][SECTIONS.indexOf(activeSection)] || "th"} 100 (100 words)`
  }
  {progressBasis === "custom_range" && (() => {
    const start = SECTIONS.indexOf(customStartSection);
    const end = SECTIONS.indexOf(customEndSection);
    const from = Math.min(start, end);
    const to = Math.max(start, end);
    const total = (to - from + 1) * 100;

    const suffix = (n: number) =>
      n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th";

    return `Tracking: ${from + 1}${suffix(from + 1)}–${to + 1}${suffix(to + 1)} 100 (${total} words)`;
  })()}
</p>
              </CardHeader>
              <CardContent className="space-y-4 p-5">
                <div className="rounded-3xl bg-gradient-to-br from-slate-50 to-white p-5 ring-1 ring-slate-200">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-slate-900">Overall progress</span>
                    <Badge>
                      {progressKnownCount}/{progressTotal}
                    </Badge>
                  </div>
                  <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200 shadow-inner">
                    <div className="h-full flex overflow-hidden rounded-full">
  <div
  className="bg-green-400 transition-all duration-300 first:rounded-l-full"
  style={{
    width: `${
      student
        ? (countByMastery(student, progressWordSet, "secure") / progressTotal) * 100
        : 0
    }%`,
  }}
/>

  <div
  className="bg-amber-300 transition-all duration-300"
  style={{
    width: `${
      student
        ? (countByMastery(student, progressWordSet, "developing") / progressTotal) * 100
        : 0
    }%`,
  }}
/>

  <div
  className="bg-rose-300 transition-all duration-300 last:rounded-r-full"
  style={{
    width: `${
      student
        ? (countByMastery(student, progressWordSet, "unknown") / progressTotal) * 100
        : 0
    }%`,
  }}
/>
</div>
                  </div>
                  <p className="mt-3 text-sm text-slate-600">{progressPercent}% secure</p>
                <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-center">
  <div className="rounded-xl border border-green-200 bg-green-50 p-2">
    <p className="font-semibold text-green-700">Secure</p>
    <p className="text-sm font-bold text-green-800">
      {student ? countByMastery(student, progressWordSet, "secure") : 0}
    </p>
  </div>

  <div className="rounded-xl border border-amber-200 bg-amber-50 p-2">
    <p className="font-semibold text-amber-700">Developing</p>
    <p className="text-sm font-bold text-amber-800">
      {student ? countByMastery(student, progressWordSet, "developing") : 0}
    </p>
  </div>

  <div className="rounded-xl border border-rose-200 bg-rose-50 p-2">
  <p className="font-semibold text-rose-700">Unknown</p>
  <p className="text-sm font-bold text-rose-800">
    {student ? countByMastery(student, progressWordSet, "unknown") : 0}
  </p>
</div>
</div>
                </div>

                <Button
                  id="tour-save-assessment"
                  variant="outline"
                  className="h-11 w-full rounded-2xl"
                  onClick={saveAssessment}
                >
                  Save assessment
                </Button>

                <Button
                  variant="outline"
                  className="h-11 w-full rounded-2xl"
                  onClick={handleOpenGraph}
                >
                  
                  Progress Graph
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
                       Class Summary
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
                    .filter((s) => s.isAddedToClass && (s.name || "").trim())
                    .map((s) => {
                      const known = countKnown(s, progressWordSet);
                      const percent = progressTotal ? Math.round((known / progressTotal) * 100) : 0;
                     
                      return (
                        <button
                          key={s.id}
                          onClick={() => {
  setSelectedId(s.id);
  setHasSelectedStudent(true);
}}
                          className={cn(
                            "rounded-3xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md",
                            s.id === selectedId
                              ? "border-slate-900 bg-slate-900 text-white"
                              : "border-slate-200 bg-white"
                          )}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="font-semibold">
                              {s.name}
                            </h3>
                            <Badge
                              className={
                                s.id === selectedId ? "border-white/20 bg-white/10 text-white" : ""
                              }
                            >
                              {known}/{progressTotal}
                            </Badge>
                          </div>
                          <p
                            className={cn(
                              "mt-2 text-sm",
                              s.id === selectedId ? "text-white/80" : "text-slate-500"
                            )}
                          >
                            {percent}% complete
                          </p>
                        </button>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* MIDDLE */}
          <div className="space-y-5">
            <Card className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
              <CardContent className="p-5 md:p-6">
                <div
                  id="tour-student-controls"
                  className="grid gap-4 md:grid-cols-2 xl:grid-cols-6"
                >
                  <div className="min-w-0">
                    <label className="mb-2 block text-sm font-medium text-slate-700">
  <span className="ml-2 inline-block">Teacher</span>
</label>
                    <Input
                      value={teacherName}
                      onChange={(e) => setTeacherName(e.target.value)}
                      className="h-11 w-full rounded-2xl text-base"
                    />
                  </div>

                  <div className="min-w-0">
                    <label className="mb-2 block text-sm font-medium text-slate-700">
  <span className="ml-2 inline-block">Student</span>
</label>
                    <select
  value={selectedId}
  onClick={() => setHasSelectedStudent(true)}
  onChange={(e) => {
    setSelectedId(e.target.value);
    setHasSelectedStudent(true);
  }}
  className="h-11 w-full rounded-2xl border border-slate-200"
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
  <span className="ml-2 inline-block">Name</span>
</label>
                    <Input
  value={draftStudentName}
  onChange={(e) => setDraftStudentName(e.target.value)}
  className="h-11 w-full rounded-2xl text-base"
/>
</div>
                  <div className="min-w-0">
                    <label className="mb-2 block text-sm font-medium text-slate-700">
  <span className="ml-2 inline-block">Search</span>
</label>
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
  <span className="ml-2 inline-block">Word List</span>
</label>
                    <select
                      value={progressBasis}
                      onChange={(e) => setProgressBasis(e.target.value as ProgressBasis)}
                      className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm"
                    >
                      <option value="all">All 1000 words</option>
<option value="through_section">Selected 100</option>
<option value="custom_range">Custom range</option>
                    </select>
                  </div>

                  {progressBasis === "custom_range" ? (
  <div className="grid gap-2 sm:grid-cols-2 xl:col-span-2">
    <div className="min-w-0">
      <label className="mb-2 block text-sm font-medium text-slate-700">
        Start level
      </label>
      <select
        value={customStartSection}
        onChange={(e) => setCustomStartSection(e.target.value)}
        className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm"
      >
        {SECTIONS.map((section, index) => (
          <option key={section} value={section}>
            {` ${index + 1}${index === 0 ? "st" : index === 1 ? "nd" : index === 2 ? "rd" : "th"} 100`}
          </option>
        ))}
      </select>
    </div>

    <div className="min-w-0">
      <label className="mb-2 block text-sm font-medium text-slate-700">
        End level
      </label>
      <select
        value={customEndSection}
        onChange={(e) => setCustomEndSection(e.target.value)}
        className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm"
      >
        {SECTIONS.map((section, index) => (
          <option key={section} value={section}>
            {` ${index + 1}${index === 0 ? "st" : index === 1 ? "nd" : index === 2 ? "rd" : "th"} 100`}
          </option>
        ))}
      </select>
    </div>
  </div>
) : (
  <div className="min-w-0" />
)}

                  <div className="flex items-end gap-3 xl:col-span-2">
                    <Button
  variant="outline"
  onClick={() => {
    if (!student) return;

   const trimmedName = draftStudentName.trim();
    if (!trimmedName) {
      setStatusMessage("Enter a student name before adding.");
      setShowStatusModal(true);
      return;
    }

    const updatedCurrent = {
      ...student,
      name: trimmedName,
      isAddedToClass: true,
    };

    const next = createStudent();

    setStudents((prev) =>
      prev.map((s) => (s.id === student.id ? updatedCurrent : s)).concat(next)
    );
    setSelectedId(next.id);
    setStatusMessage("Student added.");
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

            <Card className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
              <CardHeader className="p-5 pb-0">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <CardTitle className="text-[28px] font-semibold text-slate-900">
                    {quickMode ? "Quick assess" : activeSection}
                  </CardTitle>

                  {!quickMode ? (
                    <div className="flex flex-wrap gap-2">
                      {SECTIONS.map((section) => (
                        <Button
                          key={section}
                          variant={activeSection === section ? "default" : "outline"}
                          onClick={() => setActiveSection(section)}
                          className="h-10 rounded-xl px-4"
                        >
                          {section}
                        </Button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </CardHeader>

              <CardContent className="space-y-4 p-5">
                {quickMode ? (
                  <div
  className={`rounded-3xl border p-6 text-center transition duration-150 ${
    quickFeedback === "secure"
      ? "border-green-300 bg-green-50"
      : quickFeedback === "developing"
      ? "border-orange-300 bg-orange-50"
      : quickFeedback === "unknown"
      ? "border-red-300 bg-red-50"
      : "border-slate-200 bg-slate-50"
  }`}
>
                    <p className="text-sm uppercase tracking-[0.18em] text-slate-500">
                      Quick assess
                    </p>
                    <h3 className="mt-3 text-3xl font-bold text-slate-900">
                      {allWords[quickIndex]}
                    </h3>
                 <div className="mt-6 flex flex-wrap justify-center gap-3">
  <Button
    type="button"
    onClick={() => nextQuickWord("secure")}
    className="!h-11 !rounded-2xl !px-6 !bg-green-100 !text-green-700 !border !border-green-300 hover:!bg-green-200"
  >
    Secure
  </Button>

  <Button
    type="button"
    onClick={() => nextQuickWord("developing")}
    className="!h-11 !rounded-2xl !px-6 !bg-orange-100 !text-orange-700 !border !border-orange-300 hover:!bg-orange-200"
  >
    Developing
  </Button>

  <Button
    type="button"
    onClick={() => nextQuickWord("unknown")}
    className="!h-11 !rounded-2xl !px-6 !bg-red-100 !text-red-700 !border !border-red-300 hover:!bg-red-200"
  >
    Unknown
  </Button>
</div>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        onClick={() => markWholeSection(activeSection, "secure")}
                        className="h-10 rounded-xl px-4"
                      >
                        All Secure
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => markWholeSection(activeSection, "developing")}
                        className="h-10 rounded-xl px-4"
                      >
                        All Developing
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => markWholeSection(activeSection, "unknown")}
                        className="h-10 rounded-xl px-4"
                      >
                        All Unknown
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => promoteDevelopingToSecure(activeSection)}
                        className="h-10 rounded-xl px-4"
                      >
                        Developing → Secure
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => promoteUnknownToDeveloping(activeSection)}
                        className="h-10 rounded-xl px-4"
                      >
                        Unknown → Developing
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => markWholeSection(activeSection, "reset")}
                        className="h-10 rounded-xl px-4"
                      >
                        Reset
                      </Button>
                    </div>

                    <div id="tour-word-grid">
                      <ScrollArea className="h-[560px] pr-3">
                       <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                          {filteredWords.map((word) => {
                            const mastery = student.mastery?.[activeSection]?.[word];
                            const inPracticeList = (student.selectedPracticeWords || []).includes(
                              word
                            );

                            return (
                              <div
                                key={word}
                                className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
                              >
                                <button
  onClick={() => toggleWord(word, activeSection)}
  disabled={!hasSelectedStudent}
  className={`min-h-[88px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-5 text-left text-[28px] font-semibold text-slate-800 
    `}
>
                                  {word}
                                </button>

                                <div className="mt-4 flex flex-wrap gap-2">
                                  <button
                                   onClick={() => {
  

  setMastery(word, activeSection, "secure");
}}

                                    className={cn(
  "min-w-[96px] flex-1 rounded-2xl border px-3 py-3 text-center",
  mastery === "secure"
    ? "border-green-500 bg-green-500 text-white"
    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100",
  !selectedId && "opacity-50 cursor-not-allowed"
)}
                                  >
                                    Secure
                                  </button>

                                  <button
                                    onClick={() => setMastery(word, activeSection, "developing")}
                                    className={cn(
                                      "min-w-[120px] flex-1 rounded-2xl border px-3 py-3 text-center text-sm leading-tight transition-colors duration-150",
                                      mastery === "developing"
                                        ? "border-orange-400 bg-orange-400 text-white"
                                        : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                                    )}
                                  >
                                    Developing
                                  </button>

                                  <button
                                    onClick={() => setMastery(word, activeSection, "unknown")}
                                    className={cn(
                                      "min-w-[110px] flex-1 rounded-2xl border px-3 py-3 text-center text-sm leading-tight transition-colors duration-150",
                                      mastery === "unknown"
                                        ? "border-rose-500 bg-rose-500 text-white"
                                        : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                                    )}
                                  >
                                    Unknown
                                  </button>
                                </div>

                                <Button
                                  variant="outline"
                                  onClick={() => togglePracticeWord(word)}
                                  className="mt-3 h-10 w-full rounded-2xl"
                                >
                                  {inPracticeList ? "Remove from practice" : "Add to practice"}
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* RIGHT */}
          <div className="space-y-5">
           <Card id="tour-practice-list" className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
              <CardHeader className="p-5 pb-0">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <CardTitle className="text-[28px] font-semibold text-slate-900">
                  Practice List
                  </CardTitle>
                 
                </div>
              </CardHeader>

              <CardContent className="space-y-4 p-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Practice List Choice
                  </label>
                  <select
                    value={practiceMode}
                    onChange={(e) => setPracticeMode(e.target.value as PracticeMode)}
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm"
                  >
                    <option value="automatic">Automatic</option>
                    <option value="selected">Teacher selected</option>
                  </select>
                </div>

                {practiceMode === "automatic" ? (
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Strategy
                    </label>
                    <select
                      value={autoPracticeStrategy}
                      onChange={(e) =>
                        setAutoPracticeStrategy(e.target.value as AutoPracticeStrategy)
                      }
                      className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm"
                    >
                      <option value="priority_fix">Priority fix</option>
                      <option value="confidence_builder">Confidence builder</option>
                      <option value="targeted_intervention">Targeted intervention</option>
                    </select>
                  </div>
                ) : null}

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Number of words
                  </label>
                  <select
                    value={practiceCount}
                    onChange={(e) => setPracticeCount(Number(e.target.value) as 10 | 20)}
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                  </select>
                </div>

                <div className="rounded-2xl border border-teal-500 bg-white p-4 text-sm">
  <p className="font-semibold">You’re doing great! Please practise these words.</p>
  <p className="mt-3 leading-7">
    {getPracticeWords().length
      ? getPracticeWords().join(", ")
      : "No words selected yet."}
  </p>
</div>

                <Button
  variant="outline"
  onClick={openPracticeListPopup}
  className="h-10 w-full rounded-xl"
>
  
  Practice List
</Button>
              </CardContent>
            </Card>

            <Card className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
              <CardHeader className="p-5 pb-0">
                <CardTitle className="text-[28px] font-semibold text-slate-900">
                  Assessment history
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                {student.history.length ? (
                  <div className="space-y-3">
                    {[...student.history].reverse().map((entry, index) => (
                      <div
                        key={`${entry.date}-${index}`}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-semibold text-slate-900">{entry.date}</h4>
                          <Badge>
                            {entry.knownCount}/{entry.totalCount}
                          </Badge>
                        </div>
                        <div className="mt-3 grid grid-cols-3 gap-2 text-sm text-slate-600">
                          <p>Secure: {entry.secureCount}</p>
                          <p>Developing: {entry.developingCount}</p>
                          <p>Unknown: {entry.unknownCount}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No assessments saved yet.</p>
                )}
              </CardContent>
            </Card>

            {statusMessage ? (
              <Card className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
                <CardContent className="p-5">
                  <p className="text-sm text-slate-600">{statusMessage}</p>
                </CardContent>
              </Card>
            ) : null}
            {showReportPreview && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">

      <h2 className="text-xl font-semibold mb-4">
        Progress Report
      </h2>

      <p className="mb-2">
        Words Known: {progressKnownCount}
      </p>

      <p className="mb-2">
        Total Words: {progressTotal}
      </p>

      <p className="mb-4">
        Progress: {progressPercent}%
      </p>

      <Button
        onClick={() => setShowReportPreview(false)}
        className="w-full rounded-xl"
      >
        Close
      </Button>

    </div>
  </div>
  )}
          </div>
        </div>
      </div>
      {showStatusModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
    <div className="bg-white rounded-2xl shadow-xl p-6 w-[320px] text-center">
      <p className="text-slate-800 text-sm mb-4">{statusMessage}</p>

      <button
        onClick={() => setShowStatusModal(false)}
        className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm"
      >
        OK
      </button>
    </div>
  </div>
)}
    </div>
  );
}