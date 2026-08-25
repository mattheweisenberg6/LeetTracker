import { useEffect, useMemo, useState, type FormEvent } from 'react';

type TabKey = 'problems' | 'revisit' | 'tags' | 'platforms' | 'hierarchies';

type Platform = {
  id: string;
  name: string;
  color: string;
};

type Tag = {
  id: string;
  name: string;
  parentId: string | null;
  color: string;
  mastery: number;
};

type Problem = {
  id: string;
  number: string;
  title: string;
  platformId: string;
  difficulty: string;
  normalizedDifficulty: number;
  url: string;
  summary: string;
  notes: string;
  tags: string[];
  favorite: boolean;
  needsReview: boolean;
  advanced: boolean;
  solutionUrl: string;
  submissionUrl: string;
  createdAt: string;
  mastery: Record<string, number>;
};

type AppData = {
  platforms: Platform[];
  tags: Tag[];
  problems: Problem[];
};

type ProblemDraft = {
  number: string;
  title: string;
  platformId: string;
  difficulty: string;
  normalizedDifficulty: number;
  url: string;
  summary: string;
  notes: string;
  tags: string[];
  favorite: boolean;
  needsReview: boolean;
  advanced: boolean;
  solutionUrl: string;
  submissionUrl: string;
};

const STORAGE_KEY = 'leettrack-data-v1';

const defaultPlatforms: Platform[] = [
  { id: 'leetcode', name: 'LeetCode', color: '#2bb673' },
  { id: 'leetcode-easy', name: 'LeetCode Easy', color: '#4db5ff' },
  { id: 'codeforces', name: 'Codeforces', color: '#f4b542' },
  { id: 'cses', name: 'CSES', color: '#58b4d8' },
  { id: 'quant', name: 'Quant Questions', color: '#a077ff' },
  { id: 'database', name: 'Database problems', color: '#ff7a59' },
];

const defaultTags: Tag[] = [
  { id: 'binary-search', name: 'Binary Search', parentId: 'search-algorithms', color: '#8a5cf6', mastery: 3 },
  { id: 'search-algorithms', name: 'Search Algorithms', parentId: null, color: '#8a5cf6', mastery: 7 },
  { id: 'graph', name: 'Graph', parentId: null, color: '#3bb18b', mastery: 4 },
  { id: 'dp', name: 'Dynamic Programming', parentId: null, color: '#ff9f43', mastery: 5 },
  { id: 'sliding-window', name: 'Sliding Window', parentId: null, color: '#52b6ff', mastery: 3 },
  { id: 'sql', name: 'SQL', parentId: 'database', color: '#ff7a59', mastery: 2 },
  { id: 'database', name: 'Database', parentId: null, color: '#ff7a59', mastery: 6 },
  { id: 'greedy', name: 'Greedy', parentId: null, color: '#e15d64', mastery: 2 },
];

const defaultProblems: Problem[] = [
  {
    id: 'p-1',
    number: '4',
    title: 'Median of Two Sorted Arrays',
    platformId: 'leetcode',
    difficulty: 'Hard',
    normalizedDifficulty: 8,
    url: 'https://leetcode.com/problems/median-of-two-sorted-arrays/',
    summary: 'Given two sorted arrays, find the median in logarithmic time.',
    notes: 'Binary search on smaller array; handle even/odd split carefully.\n\nEdge case: one array empty.',
    tags: ['binary-search', 'search-algorithms'],
    favorite: true,
    needsReview: false,
    advanced: true,
    solutionUrl: 'https://github.com/example/median-two-sorted-arrays',
    submissionUrl: 'https://leetcode.com/submissions/detail/123456789/',
    createdAt: '2025-02-01',
    mastery: { 'binary-search': 3, 'search-algorithms': 3 },
  },
  {
    id: 'p-2',
    number: '911',
    title: 'Online Election',
    platformId: 'leetcode',
    difficulty: 'Medium',
    normalizedDifficulty: 5,
    url: 'https://leetcode.com/problems/online-election/',
    summary: 'Track leader changes over time using a persistent voting record.',
    notes: 'Map vote counts over time; use a prefix structure to answer queries fast.\n\nRemember to handle ties with deterministic ordering.',
    tags: ['binary-search', 'graph'],
    favorite: false,
    needsReview: true,
    advanced: false,
    solutionUrl: 'https://github.com/example/online-election',
    submissionUrl: 'https://leetcode.com/submissions/detail/987654321/',
    createdAt: '2025-03-01',
    mastery: { 'binary-search': 2, graph: 1 },
  },
  {
    id: 'p-3',
    number: '174',
    title: 'Dungeon Game',
    platformId: 'leetcode',
    difficulty: 'Hard',
    normalizedDifficulty: 7,
    url: 'https://leetcode.com/problems/dungeon-game/',
    summary: 'Minimize health loss while traversing from top-left to bottom-right.',
    notes: 'Reverse DP is the elegant solution.\n\nInitialize minimum health with downstream requirements in mind.',
    tags: ['dp'],
    favorite: true,
    needsReview: false,
    advanced: true,
    solutionUrl: 'https://github.com/example/dungeon-game',
    submissionUrl: 'https://leetcode.com/submissions/detail/882345672/',
    createdAt: '2025-04-20',
    mastery: { dp: 1 },
  },
  {
    id: 'p-4',
    number: 'Price Query',
    title: 'SQL sales analysis',
    platformId: 'database',
    difficulty: 'Medium',
    normalizedDifficulty: 6,
    url: 'https://example.com/sql/price-query',
    summary: 'Aggregate sales and query price deltas by region and month.',
    notes: 'Use window functions and grouped rolling metrics carefully.\n\nBe careful with date boundaries.',
    tags: ['sql', 'database'],
    favorite: false,
    needsReview: false,
    advanced: true,
    solutionUrl: 'https://github.com/example/sql-sales',
    submissionUrl: 'https://example.com/submissions/sql-query',
    createdAt: '2025-05-11',
    mastery: { sql: 2, database: 2 },
  },
];

const seededData: AppData = {
  platforms: defaultPlatforms,
  tags: defaultTags,
  problems: defaultProblems,
};

const defaultDraft = (): ProblemDraft => ({
  number: '',
  title: '',
  platformId: defaultPlatforms[0].id,
  difficulty: 'Medium',
  normalizedDifficulty: 5,
  url: '',
  summary: '',
  notes: '',
  tags: ['binary-search'],
  favorite: false,
  needsReview: false,
  advanced: false,
  solutionUrl: '',
  submissionUrl: '',
});

function loadState(): AppData {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return seededData;
  }

  try {
    return JSON.parse(raw) as AppData;
  } catch {
    return seededData;
  }
}

function formatDate(value: string): string {
  if (!value) return 'N/A';
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36)}`;
}

function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('problems');
  const [data, setData] = useState<AppData>(() => loadState());
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [fullView, setFullView] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('all');
  const [greatOnly, setGreatOnly] = useState(false);
  const [sortOrder, setSortOrder] = useState('newest');
  const [draft, setDraft] = useState<ProblemDraft>(defaultDraft());
  const [showForm, setShowForm] = useState(false);
  const [editingProblemId, setEditingProblemId] = useState<string | null>(null);
  const [tagDraft, setTagDraft] = useState('');
  const [newPlatformName, setNewPlatformName] = useState('');
  const [newPlatformColor, setNewPlatformColor] = useState('#5ba4ff');
  const [editedTagId, setEditedTagId] = useState<string | null>(null);
  const [tagNameInput, setTagNameInput] = useState('');
  const [hierarchyParent, setHierarchyParent] = useState<string>('');
  const [hierarchyChild, setHierarchyChild] = useState<string>('');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const platformMap = useMemo(
    () => Object.fromEntries(data.platforms.map((platform) => [platform.id, platform])),
    [data.platforms],
  );

  const tagMap = useMemo(
    () => Object.fromEntries(data.tags.map((tag) => [tag.id, tag])),
    [data.tags],
  );

  const tagUsage = useMemo(() => {
    const usage: Record<string, number> = {};
    data.problems.forEach((problem) => {
      problem.tags.forEach((tagId) => {
        usage[tagId] = (usage[tagId] ?? 0) + 1;
      });
    });
    return usage;
  }, [data.problems]);

  const tagMastery = useMemo(() => {
    const totals: Record<string, number> = {};
    data.problems.forEach((problem) => {
      Object.entries(problem.mastery).forEach(([tagId, value]) => {
        totals[tagId] = (totals[tagId] ?? 0) + value;
      });
    });
    return totals;
  }, [data.problems]);

  const stats = useMemo(() => {
    const total = data.problems.length;
    const byPlatform = data.platforms.reduce<Record<string, number>>((acc, platform) => {
      acc[platform.name] = data.problems.filter((problem) => problem.platformId === platform.id).length;
      return acc;
    }, {});

    const byDifficulty = data.problems.reduce<Record<string, number>>((acc, problem) => {
      const key = problem.difficulty;
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});

    const weakTags = data.tags
      .map((tag) => ({
        ...tag,
        usage: tagUsage[tag.id] ?? 0,
        mastery: tagMastery[tag.id] ?? tag.mastery,
      }))
      .sort((a, b) => (a.mastery + a.usage) - (b.mastery + b.usage))
      .slice(0, 5);

    const dueReview = data.problems
      .filter((problem) => problem.needsReview || !problem.favorite)
      .map((problem) => ({
        ...problem,
        weakestTag: (problem.tags || []).reduce<string | null>((lowest, tagId) => {
          const current = tagMastery[tagId] ?? 0;
          if (!lowest || current < (tagMastery[lowest] ?? 0)) return tagId;
          return lowest;
        }, null),
      }))
      .slice(0, 4);

    return { total, byPlatform, byDifficulty, weakTags, dueReview };
  }, [data, tagMastery, tagUsage]);

  const heatmap = useMemo(() => {
    const days = 28;
    const cells: number[] = Array.from({ length: days }, (_, index) => {
      const day = new Date();
      day.setDate(day.getDate() - (days - index - 1));
      const matches = data.problems.filter((problem) => {
        const created = new Date(problem.createdAt);
        return created.toDateString() === day.toDateString();
      }).length;
      return matches;
    });
    return cells;
  }, [data.problems]);

  const filteredProblems = useMemo(() => {
    const cleanedQuery = searchQuery.trim().toLowerCase();
    const nextProblems = data.problems.filter((problem) => {
      const matchesQuery =
        !cleanedQuery ||
        problem.title.toLowerCase().includes(cleanedQuery) ||
        problem.tags.some((tagId) => (tagMap[tagId]?.name ?? '').toLowerCase().includes(cleanedQuery));

      const matchesPlatform = platformFilter === 'all' || problem.platformId === platformFilter;
      const matchesDifficulty = difficultyFilter === 'all' || problem.difficulty === difficultyFilter;
      const matchesTag = tagFilter === 'all' || problem.tags.includes(tagFilter);
      const matchesGreat = !greatOnly || problem.favorite;

      return matchesQuery && matchesPlatform && matchesDifficulty && matchesTag && matchesGreat;
    });

    const sorted = [...nextProblems].sort((a, b) => {
      switch (sortOrder) {
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'difficulty':
          return b.normalizedDifficulty - a.normalizedDifficulty;
        case 'title':
          return a.title.localeCompare(b.title);
        case 'newest':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return sorted;
  }, [data.problems, difficultyFilter, greatOnly, platformFilter, searchQuery, sortOrder, tagFilter, tagMap]);

  const revisitProblems = useMemo(
    () => filteredProblems.filter((problem) => problem.needsReview),
    [filteredProblems],
  );

  const activeProblemList = activeTab === 'revisit' ? revisitProblems : filteredProblems;

  const totalPages = Math.max(1, Math.ceil(activeProblemList.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const pageItems = activeProblemList.slice(startIndex, startIndex + pageSize);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, platformFilter, difficultyFilter, tagFilter, greatOnly, sortOrder, activeTab]);

  const submitProblem = (event: FormEvent) => {
    event.preventDefault();

    const nextProblem: Problem = {
      id: editingProblemId ?? uid('problem'),
      number: draft.number,
      title: draft.title,
      platformId: draft.platformId,
      difficulty: draft.difficulty,
      normalizedDifficulty: Number(draft.normalizedDifficulty) || 5,
      url: draft.url,
      summary: draft.summary,
      notes: draft.notes,
      tags: draft.tags,
      favorite: draft.favorite,
      needsReview: draft.needsReview,
      advanced: draft.advanced,
      solutionUrl: draft.solutionUrl,
      submissionUrl: draft.submissionUrl,
      createdAt: editingProblemId
        ? data.problems.find((problem) => problem.id === editingProblemId)?.createdAt ?? new Date().toISOString()
        : new Date().toISOString(),
      mastery: Object.fromEntries(
        draft.tags.map((tagId) => [tagId, data.problems.find((problem) => problem.id === editingProblemId)?.mastery[tagId] ?? 1]),
      ),
    };

    setData((current) => ({
      ...current,
      problems: editingProblemId
        ? current.problems.map((problem) => (problem.id === editingProblemId ? nextProblem : problem))
        : [nextProblem, ...current.problems],
      tags: current.tags.map((tag) => ({
        ...tag,
        mastery:
          nextProblem.tags.includes(tag.id) && !editingProblemId
            ? tag.mastery + 1
            : tag.mastery,
      })),
    }));

    setDraft(defaultDraft());
    setEditingProblemId(null);
    setShowForm(false);
  };

  const deleteProblem = (id: string) => {
    const confirmed = window.confirm('Delete this problem from your tracker?');
    if (!confirmed) return;
    setData((current) => ({
      ...current,
      problems: current.problems.filter((problem) => problem.id !== id),
    }));
  };

  const toggleProblemFlag = (id: string, field: 'favorite' | 'needsReview' | 'advanced') => {
    setData((current) => ({
      ...current,
      problems: current.problems.map((problem) =>
        problem.id === id ? { ...problem, [field]: !problem[field] } : problem,
      ),
    }));
  };

  const addDrill = (problemId: string, tagId: string) => {
    setData((current) => ({
      ...current,
      problems: current.problems.map((problem) => {
        if (problem.id !== problemId) return problem;
        const mastery = { ...problem.mastery, [tagId]: (problem.mastery[tagId] ?? 0) + 1 };
        return { ...problem, mastery };
      }),
      tags: current.tags.map((tag) =>
        tag.id === tagId ? { ...tag, mastery: tag.mastery + 1 } : tag,
      ),
    }));
  };

  const createTag = () => {
    if (!tagDraft.trim()) return;
    const name = tagDraft.trim();
    const tagId = uid('tag');
    const newTag: Tag = {
      id: tagId,
      name,
      parentId: null,
      color: '#7b61ff',
      mastery: 0,
    };
    setData((current) => ({ ...current, tags: [...current.tags, newTag] }));
    setTagDraft('');
  };

  const renameTag = (tagId: string, nextName: string) => {
    if (!nextName.trim()) return;
    setData((current) => ({
      ...current,
      tags: current.tags.map((tag) => (tag.id === tagId ? { ...tag, name: nextName.trim() } : tag)),
    }));
  };

  const deleteTag = (tagId: string) => {
    if (!window.confirm('Delete this tag and remove it from all problems?')) return;
    setData((current) => ({
      ...current,
      tags: current.tags.filter((tag) => tag.id !== tagId),
      problems: current.problems.map((problem) => ({
        ...problem,
        tags: problem.tags.filter((id) => id !== tagId),
        mastery: Object.fromEntries(
          Object.entries(problem.mastery).filter(([key]) => key !== tagId),
        ),
      })),
    }));
  };

  const mergeTag = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;
    setData((current) => ({
      ...current,
      tags: current.tags.filter((tag) => tag.id !== sourceId),
      problems: current.problems.map((problem) => ({
        ...problem,
        tags: problem.tags.map((tagId) => (tagId === sourceId ? targetId : tagId)),
        mastery: Object.fromEntries(
          Object.entries(problem.mastery).reduce<[string, number][]>((acc, [key, value]) => {
            if (key === sourceId) {
              const existing = acc.find(([candidate]) => candidate === targetId);
              if (existing) {
                existing[1] += value;
              } else {
                acc.push([targetId, value]);
              }
              return acc;
            }
            acc.push([key, value]);
            return acc;
          }, []),
        ),
      })),
    }));
  };

  const addPlatform = () => {
    if (!newPlatformName.trim()) return;
    const nextPlatform: Platform = {
      id: uid('platform'),
      name: newPlatformName.trim(),
      color: newPlatformColor,
    };
    setData((current) => ({ ...current, platforms: [...current.platforms, nextPlatform] }));
    setNewPlatformName('');
    setNewPlatformColor('#5ba4ff');
  };

  const deletePlatform = (platformId: string) => {
    if (!window.confirm('Delete this platform record?')) return;
    setData((current) => ({
      ...current,
      platforms: current.platforms.filter((platform) => platform.id !== platformId),
      problems: current.problems.filter((problem) => problem.platformId !== platformId),
    }));
  };

  const setTagParent = () => {
    if (!hierarchyParent || !hierarchyChild) return;
    setData((current) => ({
      ...current,
      tags: current.tags.map((tag) =>
        tag.id === hierarchyChild ? { ...tag, parentId: hierarchyParent } : tag,
      ),
    }));
    setHierarchyParent('');
    setHierarchyChild('');
  };

  const difficultyClass = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return 'difficulty-easy';
      case 'hard':
        return 'difficulty-hard';
      case 'medium':
      default:
        return 'difficulty-medium';
    }
  };

  const activeTagName = tagFilter !== 'all' ? tagMap[tagFilter]?.name ?? 'Tag' : null;

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="title-block">
          <div className="title">LeetTrack</div>
        </div>

        <div className="utility-actions">
          <button className="utility-solid" type="button">Log Out</button>
        </div>
      </header>

      <main className="content-shell">
        <nav className="tabs" aria-label="Main navigation">
          {(['problems', 'revisit', 'tags', 'platforms', 'hierarchies'] as TabKey[]).map((tab) => (
            <button
              key={tab}
              type="button"
              className={`tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'problems' && 'Problems'}
              {tab === 'revisit' && 'Revisit'}
              {tab === 'tags' && 'Tags'}
              {tab === 'platforms' && 'Platforms'}
              {tab === 'hierarchies' && 'Tag Hierarchies'}
            </button>
          ))}
        </nav>

        {(activeTab === 'problems' || activeTab === 'revisit') && (
          <section className="panel">
            <div className="summary-grid">
              <div className="stat-card accent">
                <span className="label">Total solved</span>
                <strong>{stats.total}</strong>
              </div>
              <div className="stat-card">
                <span className="label">Easy</span>
                <strong>{stats.byDifficulty.Easy ?? 0}</strong>
              </div>
              <div className="stat-card">
                <span className="label">Medium</span>
                <strong>{stats.byDifficulty.Medium ?? 0}</strong>
              </div>
              <div className="stat-card">
                <span className="label">Hard</span>
                <strong>{stats.byDifficulty.Hard ?? 0}</strong>
              </div>
            </div>

            <div className="dashboard-grid">
              <div className="mini-panel">
                <h3>Platform split</h3>
                {data.platforms.map((platform) => (
                  <div className="metric-row" key={platform.id}>
                    <div className="metric-meta">
                      <span className="dot" style={{ background: platform.color }} />
                      <span>{platform.name}</span>
                    </div>
                    <strong>{data.problems.filter((problem) => problem.platformId === platform.id).length}</strong>
                  </div>
                ))}
              </div>

              <div className="mini-panel">
                <h3>Tag coverage</h3>
                <div className="coverage-list">
                  {stats.weakTags.map((tag) => {
                    const pct = Math.min(100, ((tag.mastery || 1) / Math.max(10, tag.mastery + tag.usage + 1)) * 100);
                    return (
                      <div key={tag.id} className="coverage-item">
                        <div className="coverage-label">
                          <span>{tag.name}</span>
                          <span>{tag.mastery ?? 0}</span>
                        </div>
                        <div className="coverage-bar">
                          <span style={{ width: `${pct}%`, background: tag.color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mini-panel heatmap-panel">
                <h3>Activity</h3>
                <div className="heatmap-grid">
                  {heatmap.map((value, index) => (
                    <span
                      key={`${index}-${value}`}
                      className={`heat-cell level-${Math.min(4, value)}`}
                      title={`${value} solved on this day`}
                    />
                  ))}
                </div>
              </div>

              <div className="mini-panel">
                <h3>Due for review</h3>
                <ul className="review-list">
                  {stats.dueReview.map((problem) => (
                    <li key={problem.id}>
                      <strong className={`problem-inline-title ${difficultyClass(problem.difficulty)}`}>{problem.title}</strong>
                      <span>{problem.needsReview ? 'Needs review' : 'Low mastery'}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="create-bar">
              {defaultPlatforms.map((platform) => (
                <button
                  key={platform.id}
                  type="button"
                  className="create-problem-button"
                  style={{ background: platform.color }}
                  onClick={() => {
                    setEditingProblemId(null);
                    setDraft((current) => ({ ...current, platformId: platform.id }));
                    setShowForm(true);
                  }}
                >
                  {platform.name === 'LeetCode' ? 'Add LeetCode' : platform.name === 'LeetCode Easy' ? 'Add LeetCode Easy' : `Add ${platform.name}`}
                </button>
              ))}
              <button
                type="button"
                className="create-problem-button generic"
                onClick={() => {
                  setEditingProblemId(null);
                  setDraft(defaultDraft());
                  setShowForm(true);
                }}
              >
                Create Problem
              </button>
            </div>

            {showForm && (
              <form className="problem-form" onSubmit={submitProblem}>
                <div className="form-grid">
                  <label>
                    Number
                    <input
                      value={draft.number}
                      onChange={(event) => setDraft({ ...draft, number: event.target.value })}
                    />
                  </label>
                  <label>
                    Title
                    <input
                      value={draft.title}
                      onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                    />
                  </label>
                  <label>
                    Platform
                    <select
                      value={draft.platformId}
                      onChange={(event) => setDraft({ ...draft, platformId: event.target.value })}
                    >
                      {data.platforms.map((platform) => (
                        <option key={platform.id} value={platform.id}>
                          {platform.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Difficulty
                    <select
                      value={draft.difficulty}
                      onChange={(event) => setDraft({ ...draft, difficulty: event.target.value })}
                    >
                      {['Easy', 'Medium', 'Hard'].map((level) => (
                        <option key={level} value={level}>
                          {level}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Normalized score
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={draft.normalizedDifficulty}
                      onChange={(event) =>
                        setDraft({ ...draft, normalizedDifficulty: Number(event.target.value) || 0 })
                      }
                    />
                  </label>
                  <label>
                    Problem URL
                    <input
                      value={draft.url}
                      onChange={(event) => setDraft({ ...draft, url: event.target.value })}
                    />
                  </label>
                  <label className="full-span">
                    Summary
                    <textarea
                      value={draft.summary}
                      onChange={(event) => setDraft({ ...draft, summary: event.target.value })}
                    />
                  </label>
                  <label className="full-span">
                    Notes
                    <textarea
                      value={draft.notes}
                      onChange={(event) => setDraft({ ...draft, notes: event.target.value })}
                    />
                  </label>
                  <label className="full-span">
                    Tags
                    <select
                      multiple
                      value={draft.tags}
                      onChange={(event) => {
                        const selected = Array.from(event.target.selectedOptions, (entry) => entry.value);
                        setDraft({ ...draft, tags: selected });
                      }}
                    >
                      {data.tags.map((tag) => (
                        <option key={tag.id} value={tag.id}>
                          {tag.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    GitHub / code link
                    <input
                      value={draft.solutionUrl}
                      onChange={(event) => setDraft({ ...draft, solutionUrl: event.target.value })}
                    />
                  </label>
                  <label>
                    Submission link
                    <input
                      value={draft.submissionUrl}
                      onChange={(event) => setDraft({ ...draft, submissionUrl: event.target.value })}
                    />
                  </label>
                </div>
                <div className="inline-flags">
                  <label><input type="checkbox" checked={draft.favorite} onChange={() => setDraft({ ...draft, favorite: !draft.favorite })} /> Favorite</label>
                  <label><input type="checkbox" checked={draft.needsReview} onChange={() => setDraft({ ...draft, needsReview: !draft.needsReview })} /> Needs review</label>
                  <label><input type="checkbox" checked={draft.advanced} onChange={() => setDraft({ ...draft, advanced: !draft.advanced })} /> Advanced</label>
                </div>
                <div className="form-actions">
                  <button type="submit" className="primary-button">Save problem</button>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => {
                      setEditingProblemId(null);
                      setShowForm(false);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <div className="toolbar">
              <label className="field">
                <span>Search</span>
                <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Title or tag" />
              </label>
              <label className="field">
                <span>Platform</span>
                <select value={platformFilter} onChange={(event) => setPlatformFilter(event.target.value)}>
                  <option value="all">All platforms</option>
                  {data.platforms.map((platform) => (
                    <option key={platform.id} value={platform.id}>
                      {platform.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Difficulty</span>
                <select value={difficultyFilter} onChange={(event) => setDifficultyFilter(event.target.value)}>
                  <option value="all">All difficulty</option>
                  {['Easy', 'Medium', 'Hard'].map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Tag</span>
                <select value={tagFilter} onChange={(event) => setTagFilter(event.target.value)}>
                  <option value="all">All tags</option>
                  {data.tags.map((tag) => (
                    <option key={tag.id} value={tag.id}>
                      {tag.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="checkbox-wrap">
                <input type="checkbox" checked={greatOnly} onChange={() => setGreatOnly((value) => !value)} />
                Favorite
              </label>
              <label className="field sort-field">
                <span>Sort</span>
                <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)}>
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="difficulty">Difficulty</option>
                  <option value="title">Title</option>
                </select>
              </label>
            </div>

            <div className="list-header">
              <span>
                Showing {activeProblemList.length === 0 ? 0 : startIndex + 1}–{Math.min(startIndex + pageSize, activeProblemList.length)} of {activeProblemList.length}
              </span>
              <div className="pagination">
                <button type="button" onClick={() => setPage(1)} disabled={safePage === 1}>First</button>
                <button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={safePage === 1}>Prev</button>
                <span>Page {safePage} of {totalPages}</span>
                <button type="button" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={safePage === totalPages}>Next</button>
                <button type="button" onClick={() => setPage(totalPages)} disabled={safePage === totalPages}>Last</button>
                <label className="toggle-inline">
                  <input type="checkbox" checked={fullView} onChange={() => setFullView((value) => !value)} />
                  Full view
                </label>
              </div>
            </div>

            {pageItems.length === 0 ? (
              <div className="empty-state">
                <h3>No problems match your filter set</h3>
                <p>Try adjusting a filter or add your next problem using one of the platform shortcuts.</p>
              </div>
            ) : (
              <div className="problem-list">
                {pageItems.map((problem) => {
                  const platform = platformMap[problem.platformId];
                  return (
                    <article key={problem.id} className="problem-card">
                      <div className="problem-header">
                        <div className="problem-title-block">
                          <h3 className={`problem-title ${difficultyClass(problem.difficulty)}`}>
                            {problem.number}. {problem.title}
                          </h3>
                          <div className="check-row">
                            <label><input type="checkbox" checked={problem.favorite} onChange={() => toggleProblemFlag(problem.id, 'favorite')} /> Favorite</label>
                            <label><input type="checkbox" checked={problem.needsReview} onChange={() => toggleProblemFlag(problem.id, 'needsReview')} /> Revisit</label>
                            <label><input type="checkbox" checked={problem.advanced} onChange={() => toggleProblemFlag(problem.id, 'advanced')} /> Advanced</label>
                          </div>
                        </div>
                        <div className="problem-actions">
                          <button
                            type="button"
                            className="inline-button"
                            onClick={() => {
                              setEditingProblemId(problem.id);
                              setDraft({
                                number: problem.number,
                                title: problem.title,
                                platformId: problem.platformId,
                                difficulty: problem.difficulty,
                                normalizedDifficulty: problem.normalizedDifficulty,
                                url: problem.url,
                                summary: problem.summary,
                                notes: problem.notes,
                                tags: problem.tags,
                                favorite: problem.favorite,
                                needsReview: problem.needsReview,
                                advanced: problem.advanced,
                                solutionUrl: problem.solutionUrl,
                                submissionUrl: problem.submissionUrl,
                              });
                              setShowForm(true);
                            }}
                          >
                            Edit
                          </button>
                          <a href={problem.url} target="_blank" rel="noreferrer">Open</a>
                          <button type="button" className="inline-button danger" onClick={() => deleteProblem(problem.id)}>Delete</button>
                        </div>
                      </div>

                      <div className="meta-line">
                        <span className="platform-pill" style={{ background: platform?.color ?? '#5aa1ff' }}>
                          {platform?.name ?? 'Platform'}
                        </span>
                        <span>· {problem.difficulty}</span>
                        <span>· {problem.normalizedDifficulty}/10</span>
                        <span>· {formatDate(problem.createdAt)}</span>
                      </div>

                      <a href={problem.url} className="problem-url" target="_blank" rel="noreferrer">
                        {problem.url}
                      </a>

                      <div className="problem-body">
                        <div className="summary-block">
                          <strong>Summary:</strong>
                          <p>{problem.summary}</p>
                        </div>
                        <div className="notes-block">
                          <strong>Notes:</strong>
                          <pre>{problem.notes || 'No notes yet — add a quick reminder or gotcha.'}</pre>
                        </div>
                      </div>

                      <div className="tag-row">
                        {problem.tags.map((tagId) => {
                          const tag = tagMap[tagId];
                          if (!tag) return null;
                          const mastery = problem.mastery[tagId] ?? 0;
                          return (
                            <span key={tagId} className="tag-pill" style={{ borderColor: tag.color }}>
                              {tag.name} ({tagUsage[tagId] ?? 0}/{Math.max(10, mastery + (tagUsage[tagId] ?? 0))})
                              <button type="button" onClick={() => addDrill(problem.id, tagId)}>+ Drill</button>
                            </span>
                          );
                        })}
                      </div>

                      <div className="solutions-block">
                        <strong>Solutions:</strong>
                        <div className="solution-links">
                          {problem.solutionUrl ? (
                            <a href={problem.solutionUrl} target="_blank" rel="noreferrer">
                              Code link
                            </a>
                          ) : (
                            <span>No code link</span>
                          )}
                          {problem.submissionUrl ? (
                            <a href={problem.submissionUrl} target="_blank" rel="noreferrer">
                              Submission
                            </a>
                          ) : (
                            <span>No submission</span>
                          )}
                        </div>
                      </div>

                      {fullView && (
                        <div className="full-view-panel">
                          <div className="full-view-section">
                            <strong>Mastery signals</strong>
                            <ul>
                              {problem.tags.map((tagId) => (
                                <li key={tagId}>{tagMap[tagId]?.name}: {problem.mastery[tagId] ?? 0} drills</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {activeTab === 'tags' && (
          <section className="panel">
            <div className="tag-manager">
              <div className="inline-form">
                <input
                  value={tagDraft}
                  onChange={(event) => setTagDraft(event.target.value)}
                  placeholder="Create tag"
                />
                <button type="button" className="primary-button" onClick={createTag}>Add tag</button>
              </div>

              {activeTagName && (
                <div className="tag-filter-bar">
                  <span className="breadcrumb">Tags &gt; {activeTagName}</span>
                  <div className="tag-filter-actions">
                    <button type="button" className="secondary-button" onClick={() => setActiveTab('problems')}>View problems</button>
                    <button type="button" className="inline-button" onClick={() => setTagFilter('all')}>Clear filter</button>
                  </div>
                </div>
              )}

              <div className="tag-grid">
                {data.tags.map((tag) => {
                  const isEditing = editedTagId === tag.id;
                  const isActive = tagFilter === tag.id;
                  return (
                    <div
                      key={tag.id}
                      className={`tag-card ${isActive ? 'active' : ''}`}
                      onClick={() => {
                        setTagFilter(tag.id);
                        setActiveTab('problems');
                      }}
                    >
                      <div className="tag-card-header">
                        <span className="tag-chip" style={{ background: tag.color }}>
                          {tag.name}
                        </span>
                        <div className="tag-card-actions">
                          {isEditing ? (
                            <>
                              <input
                                value={tagNameInput}
                                onChange={(event) => setTagNameInput(event.target.value)}
                                onClick={(event) => event.stopPropagation()}
                                autoFocus
                              />
                              <button
                                type="button"
                                className="inline-button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  renameTag(tag.id, tagNameInput || tag.name);
                                  setEditedTagId(null);
                                  setTagNameInput('');
                                }}
                              >
                                Save
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              className="mini-icon-button"
                              title="Rename tag"
                              onClick={(event) => {
                                event.stopPropagation();
                                setEditedTagId(tag.id);
                                setTagNameInput(tag.name);
                              }}
                            >
                              ✎
                            </button>
                          )}
                          <button
                            type="button"
                            className="mini-icon-button danger"
                            title="Delete tag"
                            onClick={(event) => {
                              event.stopPropagation();
                              deleteTag(tag.id);
                            }}
                          >
                            ×
                          </button>
                        </div>
                      </div>

                      <div className="tag-card-metrics">
                        <span>{tagUsage[tag.id] ?? 0} problems</span>
                        <span>Mastery {tagMastery[tag.id] ?? tag.mastery}</span>
                      </div>

                      <div className="tag-card-footer">
                        <select
                          value=""
                          onChange={(event) => {
                            const targetId = event.target.value;
                            if (targetId) {
                              mergeTag(tag.id, targetId);
                              event.target.value = '';
                            }
                          }}
                          onClick={(event) => event.stopPropagation()}
                        >
                          <option value="">Merge with…</option>
                          {data.tags.filter((candidate) => candidate.id !== tag.id).map((candidate) => (
                            <option key={candidate.id} value={candidate.id}>{candidate.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {activeTab === 'platforms' && (
          <section className="panel">
            <div className="platform-manager">
              <div className="inline-form">
                <input value={newPlatformName} onChange={(event) => setNewPlatformName(event.target.value)} placeholder="Platform name" />
                <input type="color" value={newPlatformColor} onChange={(event) => setNewPlatformColor(event.target.value)} />
                <button type="button" className="primary-button" onClick={addPlatform}>Add platform</button>
              </div>

              <div className="platform-grid">
                {data.platforms.map((platform) => (
                  <div key={platform.id} className="platform-card">
                    <span className="platform-pill" style={{ background: platform.color }}>
                      {platform.name}
                    </span>
                    <div className="metric-row">
                      <span>Problems</span>
                      <strong>{data.problems.filter((problem) => problem.platformId === platform.id).length}</strong>
                    </div>
                    <button type="button" className="danger-button" onClick={() => deletePlatform(platform.id)}>Delete</button>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {activeTab === 'hierarchies' && (
          <section className="panel">
            <div className="hierarchy-manager">
              <div className="inline-form">
                <select value={hierarchyParent} onChange={(event) => setHierarchyParent(event.target.value)}>
                  <option value="">Select parent</option>
                  {data.tags.map((tag) => (
                    <option key={tag.id} value={tag.id}>{tag.name}</option>
                  ))}
                </select>
                <select value={hierarchyChild} onChange={(event) => setHierarchyChild(event.target.value)}>
                  <option value="">Select child</option>
                  {data.tags.map((tag) => (
                    <option key={tag.id} value={tag.id}>{tag.name}</option>
                  ))}
                </select>
                <button type="button" className="primary-button" onClick={setTagParent}>Link tag</button>
              </div>

              <div className="hierarchy-tree">
                {data.tags
                  .filter((tag) => !tag.parentId)
                  .map((parent) => (
                    <div key={parent.id} className="tree-root">
                      <div className="tree-node root-node">{parent.name}</div>
                      <div className="tree-children">
                        {data.tags
                          .filter((tag) => tag.parentId === parent.id)
                          .map((child) => (
                            <div key={child.id} className="tree-node child-node">
                              {child.name}
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
