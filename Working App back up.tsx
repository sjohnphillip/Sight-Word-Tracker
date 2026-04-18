
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Download, Plus, Printer, Search as SearchIcon, Zap, Copy } from "lucide-react";

function cn(...classes: Array<string | undefined | false | null>) {
  return classes.filter(Boolean).join(" ");
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
  variant,
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
      : "bg-slate-900 text-white border border-slate-900 hover:bg-slate-800";

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
      className={cn(
        "border border-slate-200 bg-white px-3 outline-none",
        className
      )}
    />
  );
}

function Badge({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
  variant?: "secondary";
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
const STORAGE_KEY = "fry-sight-word-tracker-clean-rebuild-v2";

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
    .filter(([word, isKnown]) => Boolean(isKnown) && (!allowedWords || allowedWords.has(word)))
    .length;
}

function countByMastery(
  student: Student | undefined,
  allowedWords: Set<string>,
  level: MasteryLevel
) {
  if (!student) return 0;

  let count = 0;
  for (const sectionName of Object.keys(student.mastery || {})) {
    const section = student.mastery[sectionName] || {};
    for (const [word, mastery] of Object.entries(section)) {
      if (allowedWords.has(word) && mastery === level) {
        count += 1;
      }
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

function printHtmlDocument(title: string, html: string, css: string) {
  const iframe = document.createElement("iframe");
  Object.assign(iframe.style, {
    position: "fixed",
    right: "0",
    bottom: "0",
    width: "0",
    height: "0",
    border: "0",
  });
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) return;

  doc.open();
  doc.write(`<!doctype html>
<html>
<head>
  <title>${title}</title>
  <style>${css}</style>
</head>
<body>
  <div class="report-shell">${html}</div>
</body>
</html>`);
  doc.close();

  setTimeout(() => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(() => {
      if (document.body.contains(iframe)) document.body.removeChild(iframe);
    }, 500);
  }, 300);
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

  const reportPrintRef = useRef<HTMLDivElement | null>(null);
  const endReportPrintRef = useRef<HTMLDivElement | null>(null);

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
      if ([10, 20].includes(parsed.practiceCount)) setPracticeCount(parsed.practiceCount);
      if (["all", "through_section", "custom_range"].includes(parsed.progressBasis)) {
        setProgressBasis(parsed.progressBasis);
      }
      if (typeof parsed.customProgressSections === "number") {
        setCustomProgressSections(parsed.customProgressSections);
      }
      if (typeof parsed.showPracticePreview === "boolean") {
        setShowPracticePreview(parsed.showPracticePreview);
      }
      if (typeof parsed.showReportPreview === "boolean") {
        setShowReportPreview(parsed.showReportPreview);
      }
      if (typeof parsed.showEndReportPreview === "boolean") {
        setShowEndReportPreview(parsed.showEndReportPreview);
      }
      if (typeof parsed.statusMessage === "string") {
        setStatusMessage(parsed.statusMessage);
      }
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
      return copy.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    }
    if (sortMode === "most") {
      return copy.sort((a, b) => countKnown(b, progressWordSet) - countKnown(a, progressWordSet));
    }
    return copy.sort((a, b) => countKnown(a, progressWordSet) - countKnown(b, progressWordSet));
  }, [students, sortMode, progressWordSet]);

  const updateStudent = (updates: Partial<Student>) => {
    if (!student) return;
    setStudents((prev) => prev.map((s) => (s.id === student.id ? { ...s, ...updates } : s)));
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

  const copyReportText = async () => {
    try {
      await navigator.clipboard.writeText(buildReportText());
      setStatusMessage("Parent report copied to clipboard.");
    } catch {
      setStatusMessage("Clipboard copy was blocked by the browser.");
    }
  };

  const printReportText = () => {
    if (!reportPrintRef.current) {
      setStatusMessage("Open Parent report first.");
      return;
    }

    printHtmlDocument(
      "Parent Report",
      reportPrintRef.current.innerHTML,
      `
      body{font-family:Arial,sans-serif;padding:24px;color:#111;background:#fff;}
      .report-shell{max-width:900px;margin:0 auto;}
      .report-box{border:1px solid #d1d5db;border-radius:16px;padding:16px;margin-bottom:16px;background:#fff;}
      .progress-track{height:12px;background:#e5e7eb;border-radius:999px;overflow:hidden;margin-top:12px;}
      .progress-fill{height:12px;background:#111827;border-radius:999px;}
      h3,h4,p{margin:0 0 10px 0;}
      `
    );
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

  const printEndReportText = () => {
    if (!endReportPrintRef.current) {
      setStatusMessage("Open End Report first.");
      return;
    }

    printHtmlDocument(
      "End Report",
      endReportPrintRef.current.innerHTML,
      `
      body{font-family:Arial,sans-serif;padding:24px;color:#111;background:#fff;}
      .report-shell{max-width:900px;margin:0 auto;}
      .report-box{border:1px solid #d1d5db;border-radius:16px;padding:16px;margin-bottom:16px;background:#fff;}
      h2,h3,h4,p{margin:0 0 10px 0;}
      `
    );
  };

  if (!student) {
    return <div className="p-4">Select a student</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-3 md:p-6">

      <div className="mx-auto max-w-7xl space-y-4">
        <div className="sticky top-0 z-20 -mx-3 border-b border-slate-200 bg-slate-50/95 px-3 py-3 backdrop-blur md:static md:mx-0 md:border-0 md:bg-transparent md:px-0 md:py-0">
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                  Fry Sight Word Tracker
                </h1>
                <p className="mt-1 text-sm text-slate-600">
                  Stable rebuild with smart practice options.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                <Button onClick={() => setQuickMode((v) => !v)} className="h-11 rounded-2xl">
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
                  className="h-11 rounded-2xl"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Top {practiceCount}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    setShowReportPreview(true);
                    setShowPracticePreview(false);
                    setShowEndReportPreview(false);
                  }}
                  className="h-11 rounded-2xl"
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
                  }}
                  className="h-11 rounded-2xl"
                >
                  End Report
                </Button>
              </div>
            </div>
          </div>
        </div>

        <Card className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
          <CardContent className="p-4 md:p-6">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Teacher name
                </label>
                <Input
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  className="h-11 rounded-2xl text-base"
                />
              </div>

              <div>
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

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Student name
                </label>
                <Input
                  value={student.name}
                  onChange={(e) => updateStudent({ name: e.target.value })}
                  className="h-11 rounded-2xl text-base"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Search</label>
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-11 rounded-2xl pl-9 text-base"
                  />
                </div>
              </div>

              <div>
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
                <div>
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
                <div />
              )}

              <div className="flex items-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    const next = createStudent();
                    setStudents([...students, next]);
                    setSelectedId(next.id);
                  }}
                  className="h-11 flex-1 rounded-2xl"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add
                </Button>

                <select
                  value={sortMode}
                  onChange={(e) => setSortMode(e.target.value as SortMode)}
                  className="h-11 flex-1 rounded-2xl border border-slate-200 bg-white px-3 text-sm"
                >
                  <option value="az">A-Z</option>
                  <option value="most">Most known</option>
                  <option value="least">Least known</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 xl:grid-cols-[1.05fr_1.8fr_1.1fr]">
          <div className="space-y-4">
            <Card className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Progress overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-3xl bg-gradient-to-br from-slate-50 to-white p-5 ring-1 ring-slate-200">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">Overall progress</span>
                    <Badge variant="secondary">
                      {progressKnownCount}/{progressTotal}
                    </Badge>
                  </div>
                  <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-slate-900 to-slate-700"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{progressPercent}% complete</p>
                </div>

                <Button variant="outline" className="w-full rounded-2xl" onClick={saveAssessment}>
                  Save assessment
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Class overview</CardTitle>
              </CardHeader>
              <CardContent>
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
                          <h3 className="font-semibold">{s.name}</h3>
                          <Badge variant="secondary">
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
            <CardHeader>
              <CardTitle className="text-lg">Assessment screen</CardTitle>
            </CardHeader>
            <CardContent>
              {quickMode ? (
                <div className="rounded-3xl border bg-slate-50 p-8 text-center">
                  <p className="mb-2 text-sm text-slate-500">Quick Assess Mode</p>
                  <h2 className="mb-6 text-4xl font-bold">{allWords[quickIndex]}</h2>
                  <div className="flex justify-center gap-3">
                    <Button className="h-12 rounded-2xl" onClick={() => nextQuickWord(true)}>
                      Correct
                    </Button>
                    <Button
                      variant="outline"
                      className="h-12 rounded-2xl"
                      onClick={() => nextQuickWord(false)}
                    >
                      Incorrect
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <ScrollArea className="w-full whitespace-nowrap pb-2">
                    <div className="inline-flex gap-2">
                      {SECTIONS.map((section) => {
                        const isActive = activeSection === section;
                        return (
                          <button
                            key={section}
                            type="button"
                            onClick={() => setActiveSection(section)}
                            className={`h-11 rounded-2xl border px-4 text-sm font-medium inline-flex items-center justify-center gap-2 ${
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

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      className="h-9 rounded-xl"
                      onClick={() => markWholeSection(activeSection, "secure")}
                    >
                      Mark all Secure
                    </Button>
                    <Button
                      variant="outline"
                      className="h-9 rounded-xl"
                      onClick={() => markWholeSection(activeSection, "developing")}
                    >
                      Mark all Developing
                    </Button>
                    <Button
                      variant="outline"
                      className="h-9 rounded-xl"
                      onClick={() => markWholeSection(activeSection, "reset")}
                    >
                      Reset section
                    </Button>
                    <Button
                      variant="outline"
                      className="h-9 rounded-xl"
                      onClick={() => promoteUnknownToDeveloping(activeSection)}
                    >
                      Unknown → Developing
                    </Button>
                    <Button
                      variant="outline"
                      className="h-9 rounded-xl"
                      onClick={() => promoteDevelopingToSecure(activeSection)}
                    >
                      Developing → Secure
                    </Button>
                  </div>

                  <div className="mt-4">
                    <ScrollArea className="h-[430px] pr-2">
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
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
                                className="min-h-[72px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-left text-base font-semibold text-slate-800"
                              >
                                {word}
                              </button>

                              <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                                <button
                                  onClick={() => setMastery(word, section, "secure")}
                                  className={`rounded-xl border px-2 py-2 transition-colors duration-150 ${
                                    mastery === "secure"
                                      ? "bg-green-500 text-white border-green-500"
                                      : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                                  }`}
                                >
                                  Secure
                                </button>

                                <button
                                  onClick={() => setMastery(word, section, "developing")}
                                  className={`rounded-xl border px-2 py-2 transition-colors duration-150 ${
                                    mastery === "developing"
                                      ? "bg-orange-400 text-white border-orange-400"
                                      : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                                  }`}
                                >
                                  Developing
                                </button>

                                <button
                                  onClick={() => setMastery(word, section, "unknown")}
                                  className={`rounded-xl border px-2 py-2 transition-colors duration-150 ${
                                    mastery === "unknown"
                                      ? "bg-red-500 text-white border-red-500"
                                      : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                                  }`}
                                >
                                  Unknown
                                </button>
                              </div>

                              <button
                                onClick={() => togglePracticeWord(word)}
                                className={`mt-3 w-full rounded-xl border px-3 py-2 text-xs transition ${
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

          <div className="space-y-4">
            <Card className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Practice list for parents</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
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

                <p className="text-sm leading-6 text-slate-700">
                  {getPracticeWords().length ? getPracticeWords().join(", ") : "No words selected yet."}
                </p>
              </CardContent>
            </Card>

            {statusMessage ? (
              <Card className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Latest action</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-700">{statusMessage}</p>
                </CardContent>
              </Card>
            ) : null}

            {showPracticePreview ? (
              <Card className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle className="text-lg">Practice list preview</CardTitle>
                    <div className="flex flex-wrap gap-2">
                      <Button onClick={downloadPracticeList} className="h-9 rounded-xl">
                        <Download className="mr-2 h-4 w-4" /> Download
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => void copyPracticeList()}
                        className="h-9 rounded-xl"
                      >
                        <Copy className="mr-2 h-4 w-4" /> Copy
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="rounded-2xl border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-700">
                    {getPracticeWords().length ? getPracticeWords().join(", ") : "No words selected yet."}
                  </div>
                  <textarea
                    readOnly
                    value={getPracticeWords().length ? getPracticeWords().join(", ") : "No words selected yet."}
                    className="min-h-[120px] w-full rounded-2xl border border-slate-200 p-3 text-sm"
                  />
                </CardContent>
              </Card>
            ) : null}

            {showReportPreview ? (
              <Card className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle className="text-lg">Parent report preview</CardTitle>
                    <div className="flex flex-wrap gap-2">
                      <Button onClick={printReportText} className="h-9 rounded-xl">
                        <Printer className="mr-2 h-4 w-4" /> Print
                      </Button>
                      <Button
                        variant="outline"
                        onClick={downloadReportText}
                        className="h-9 rounded-xl"
                      >
                        <Download className="mr-2 h-4 w-4" /> Download
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => void copyReportText()}
                        className="h-9 rounded-xl"
                      >
                        <Copy className="mr-2 h-4 w-4" /> Copy
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div ref={reportPrintRef}>
                    <div className="report-box rounded-2xl border border-slate-200 bg-white p-4">
                      <h3 className="text-lg font-semibold">Sight Word Progress Report</h3>
                      <p className="mt-2 text-sm">
                        <strong>Student:</strong> {student.name || "Student"}
                      </p>
                      <p className="text-sm">
                        <strong>Teacher:</strong> {teacherName || ""}
                      </p>
                      <p className="text-sm">
                        <strong>Words known:</strong> {progressKnownCount} / {progressTotal}
                      </p>
                      <p className="text-xs text-slate-500">
                        Based on{" "}
                        {progressBasis === "through_section"
                          ? `up to ${activeSection}`
                          : progressBasis === "custom_range"
                          ? `first ${customProgressSections * 100} words`
                          : "all Fry lists"}
                      </p>
                      <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200 progress-track">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-slate-900 to-slate-700 progress-fill"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-4 report-box rounded-2xl border border-slate-200 bg-white p-4">
                      <h4 className="font-semibold">Words to Practise</h4>
                      <p className="mt-2 text-sm leading-6 text-slate-700">
                        {getPracticeWords().length ? getPracticeWords().join(", ") : "No words selected yet."}
                      </p>
                    </div>
                  </div>

                  <textarea
                    readOnly
                    value={buildReportText()}
                    className="min-h-[180px] w-full rounded-2xl border border-slate-200 p-3 text-sm"
                  />
                </CardContent>
              </Card>
            ) : null}

            {showEndReportPreview ? (
              <Card className="rounded-[28px] border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-yellow-50 shadow-sm">
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle className="text-lg">End Report</CardTitle>
                    <div className="flex flex-wrap gap-2">
                      <Button onClick={printEndReportText} className="h-9 rounded-xl">
                        <Printer className="mr-2 h-4 w-4" /> Print
                      </Button>
                      <Button
                        variant="outline"
                        onClick={downloadEndReportText}
                        className="h-9 rounded-xl"
                      >
                        <Download className="mr-2 h-4 w-4" /> Download
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => void copyEndReportText()}
                        className="h-9 rounded-xl"
                      >
                        <Copy className="mr-2 h-4 w-4" /> Copy
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div
                    ref={endReportPrintRef}
                    className="rounded-[28px] border-4 border-amber-200 bg-white p-6 shadow-sm"
                  >
                    <div className="text-center">
                      <p className="text-sm font-medium uppercase tracking-[0.2em] text-amber-700">
                        Certificate of Progress
                      </p>
                      <h2 className="mt-2 text-3xl font-bold text-slate-900">End Report</h2>
                      <p className="mt-2 text-sm text-slate-600">
                        Celebrating sight word success and next steps
                      </p>
                    </div>

                    <div className="mt-6 grid gap-3 rounded-2xl border border-amber-100 bg-amber-50/60 p-4 md:grid-cols-3">
                      <p className="text-sm">
                        <strong>Student:</strong> {student.name || "Student"}
                      </p>
                      <p className="text-sm">
                        <strong>Teacher:</strong> {teacherName || ""}
                      </p>
                      <p className="text-sm">
                        <strong>Words known:</strong> {progressKnownCount} / {progressTotal}
                      </p>
                    </div>

                    <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                      <h3 className="text-lg font-semibold text-emerald-900">
                        Well done! You can read these words:
                      </h3>
                      <p className="mt-3 text-sm leading-7 text-slate-700">
                        {knownWordsForProgress.length
                          ? knownWordsForProgress.join(", ")
                          : "No words recorded yet."}
                      </p>
                    </div>

                    <div className="mt-4 rounded-2xl border border-orange-200 bg-orange-50 p-5">
                      <h3 className="text-lg font-semibold text-orange-900">
                        These words you should keep working on:
                      </h3>
                      <p className="mt-3 text-sm leading-7 text-slate-700">
                        {workingOnWordsForProgress.length
                          ? workingOnWordsForProgress.join(", ")
                          : "None at the moment."}
                      </p>
                    </div>
                  </div>

                  <textarea
                    readOnly
                    value={buildEndReportText()}
                    className="min-h-[220px] w-full rounded-2xl border border-slate-200 p-3 text-sm"
                  />
                </CardContent>
              </Card>
            ) : null}

            <Card className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Assessment history</CardTitle>
              </CardHeader>
              <CardContent>
                {student.history.length === 0 ? (
                  <p className="text-sm text-slate-500">No saved assessments yet.</p>
                ) : (
                  <div className="space-y-2">
                    {student.history.map((item, i) => (
                      <div key={i} className="rounded-2xl border border-slate-200 p-3 text-sm">
                        <strong>{item.date}</strong>
                        <div className="mt-1">Secure: {item.secureCount}</div>
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