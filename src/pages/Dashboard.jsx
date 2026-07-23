import {
  Add,
  CheckCircle,
  Delete,
  Download,
  Insights,
  Link as LinkIcon,
  ReportProblem,
  WarningAmber,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import api from '../api';
import Navbar from '../components/Navbar';

// ── Progress steps shown while the pipeline is running ───────────────────────
const PIPELINE_STEPS = [
  'Scraping sources',
  'Chunking & cleaning',
  'Analysing articles',
  'Generating report',
  'Verifying (Judge)',
];

// Cycle through steps roughly every 8 seconds
const STEP_INTERVAL_MS = 8_000;

// ── Small reusable components ─────────────────────────────────────────────────

function ScoreBar({ label, value }) {
  const pct = Math.round((value || 0) * 100);
  const color = pct >= 75 ? 'success' : pct >= 50 ? 'warning' : 'error';
  return (
    <Stack spacing={0.5}>
      <Stack direction="row" justifyContent="space-between">
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="caption" fontWeight={700} color={`${color}.main`}>
          {pct}%
        </Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={pct}
        color={color}
        sx={{ height: 6, borderRadius: 3 }}
      />
    </Stack>
  );
}

function SectionHeader({ children }) {
  return (
    <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
      {children}
    </Typography>
  );
}

function BulletList({ items }) {
  if (!items || items.length === 0) return null;
  return (
    <List dense disablePadding>
      {items.map((item, i) => (
        <ListItem key={i} disablePadding sx={{ py: 0.25 }}>
          <ListItemText
            primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
            primary={`• ${item}`}
          />
        </ListItem>
      ))}
    </List>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────

function Dashboard() {
  const [competitors, setCompetitors] = useState([]);
  const [topics, setTopics] = useState([]);
  const [urls, setUrls] = useState(['']);
  const [competitorInput, setCompetitorInput] = useState('');
  const [topicInput, setTopicInput] = useState('');
  const [context, setContext] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeStep, setActiveStep] = useState(0);

  const stepTimerRef = useRef(null);

  // Advance the progress stepper automatically while loading
  useEffect(() => {
    if (loading) {
      setActiveStep(0);
      stepTimerRef.current = setInterval(() => {
        setActiveStep((prev) => Math.min(prev + 1, PIPELINE_STEPS.length - 1));
      }, STEP_INTERVAL_MS);
    } else {
      clearInterval(stepTimerRef.current);
    }
    return () => clearInterval(stepTimerRef.current);
  }, [loading]);

  // ── Chip helpers ────────────────────────────────────────────────────────────
  const addChip = (type, value) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (type === 'competitor' && !competitors.includes(trimmed)) {
      setCompetitors([...competitors, trimmed]);
      setCompetitorInput('');
    }
    if (type === 'topic' && !topics.includes(trimmed)) {
      setTopics([...topics, trimmed]);
      setTopicInput('');
    }
  };

  const removeChip = (type, value) => {
    if (type === 'competitor') setCompetitors(competitors.filter((c) => c !== value));
    if (type === 'topic') setTopics(topics.filter((t) => t !== value));
  };

  const addUrlField = () => setUrls([...urls, '']);
  const updateUrl = (i, v) => {
    const next = [...urls];
    next[i] = v;
    setUrls(next);
  };
  const removeUrlField = (i) => {
    if (urls.length === 1) return;
    setUrls(urls.filter((_, idx) => idx !== i));
  };

  // ── Generate report ─────────────────────────────────────────────────────────
  const handleGenerateReport = async () => {
    const validUrls = urls.filter((u) => u.trim());
    if (validUrls.length === 0) {
      setError('Please add at least one source URL.');
      return;
    }

    setLoading(true);
    setError('');
    setReport(null);

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('Please sign in before generating a report.');
        return;
      }

      const payload = { competitors, topics, urls: validUrls, context };
      const response = await api.post('/api/research', payload);
      const d = response.data || {};

      const normalized = {
        executiveSummary: d.executiveSummary || d.executive_summary || '',
        themes: d.themes || [],
        marketTrends: d.marketTrends || d.market_trends || [],
        competitorActivities: d.competitorActivities || d.competitor_activities || [],
        businessInsights: d.businessInsights || d.business_insights || [],
        statistics: d.statistics || [],
        companiesMentioned: d.companiesMentioned || d.companies_mentioned || [],
        sourceTraceability: d.sourceTraceability || d.source_traceability || [],
        hallucinationCheck: d.hallucinationCheck || d.hallucination_check || {
          status: 'Unknown',
          confidence: 0,
          accuracy_score: 0,
          completeness_score: 0,
          unsupported_claims: [],
          overall_feedback: '',
        },
      };
      setReport(normalized);
    } catch (err) {
      const detail =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message;
      setError(
        detail
          ? `Unable to generate the report: ${detail}`
          : 'Unable to generate the report right now. Please try again shortly.',
      );
    } finally {
      setLoading(false);
    }
  };

  // ── PDF download ─────────────────────────────────────────────────────────────
  const handleDownloadPdf = () => {
    if (!report) return;
    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) {
      setError('Please allow pop-ups to download the report as PDF.');
      return;
    }

    const themeMarkup = report.themes
      .map((t) => `<div class="item"><h3>${t.title}</h3><p>${t.summary}</p>${t.sources?.length ? `<p><strong>Sources:</strong> ${t.sources.map((s) => `<a href="${s}">${s}</a>`).join(', ')}</p>` : ''}</div>`)
      .join('');
    const competitorMarkup = report.competitorActivities
      .map((a) => `<div class="item"><h3>${a.competitor}</h3><p>${a.activity}</p>${a.sources?.length ? `<p><strong>Sources:</strong> ${a.sources.map((s) => `<a href="${s}">${s}</a>`).join(', ')}</p>` : ''}</div>`)
      .join('');
    const hc = report.hallucinationCheck;
    const claimsMarkup = hc.unsupported_claims?.length
      ? hc.unsupported_claims.map((c) => `<li>${c}</li>`).join('')
      : '<li>None detected</li>';

    win.document.write(`<!doctype html><html><head><title>Market Intelligence Summary</title>
<style>
  body{font-family:Arial,sans-serif;padding:24px;color:#111827}
  h1,h2{margin-bottom:8px} .meta{color:#4b5563;margin-bottom:20px}
  .section{margin-top:20px} .item{border:1px solid #e5e7eb;border-radius:8px;padding:10px 12px;margin-bottom:10px}
  h3{margin:0 0 4px;font-size:15px} p{margin:0;line-height:1.5}
</style></head><body>
<h1>Market Intelligence Summary</h1>
<div class="meta">Generated ${new Date().toLocaleString()}</div>
${report.executiveSummary ? `<div class="section"><h2>Executive summary</h2><div class="item"><p>${report.executiveSummary}</p></div></div>` : ''}
<div class="section"><h2>Key themes</h2>${themeMarkup}</div>
<div class="section"><h2>Competitor activity</h2>${competitorMarkup}</div>
<div class="section"><h2>Source traceability</h2>${sourceMarkup}</div>
<div class="section"><h2>Hallucination check</h2>
  <div class="item">
    <p><strong>Status:</strong> ${hc.status} &nbsp;|&nbsp; <strong>Accuracy:</strong> ${Math.round((hc.accuracy_score || 0) * 100)}% &nbsp;|&nbsp; <strong>Completeness:</strong> ${Math.round((hc.completeness_score || 0) * 100)}%</p>
    <p><strong>Unsupported claims:</strong></p><ul>${claimsMarkup}</ul>
    ${hc.overall_feedback ? `<p><strong>Feedback:</strong> ${hc.overall_feedback}</p>` : ''}
  </div>
</div>
</body></html>`);
    win.document.close();
    win.focus();
    win.print();
  };

  // ── Hallucination panel ──────────────────────────────────────────────────────
  function HallucinationPanel({ hc }) {
    const isSupported = hc.status === 'Supported';
    const Icon = isSupported ? CheckCircle : WarningAmber;
    const color = isSupported ? 'success' : 'warning';
    const accuracyPct = Math.round((hc.accuracy_score || 0) * 100);
    const completenessPct = Math.round((hc.completeness_score || 0) * 100);

    return (
      <Paper
        variant="outlined"
        sx={{
          p: 2.5,
          borderRadius: 2,
          borderColor: isSupported ? 'success.main' : 'warning.main',
          bgcolor: isSupported ? 'rgba(22,163,74,0.06)' : 'rgba(217,119,6,0.06)',
        }}
      >
        <Stack spacing={2}>
          {/* Header */}
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Icon color={color} />
            <Stack>
              <Typography variant="subtitle1" fontWeight={700} color={`${color}.dark`}>
                LLM-as-a-Judge: {hc.status}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Hallucination detection via judge chain
              </Typography>
            </Stack>
          </Stack>

          {/* Score bars */}
          <Stack spacing={1.5}>
            <ScoreBar label="Accuracy" value={hc.accuracy_score || 0} />
            <ScoreBar label="Completeness" value={hc.completeness_score || 0} />
          </Stack>

          {/* Unsupported claims */}
          {hc.unsupported_claims && hc.unsupported_claims.length > 0 && (
            <Box>
              <Stack direction="row" spacing={0.5} alignItems="center" mb={0.5}>
                <ReportProblem fontSize="small" color="error" />
                <Typography variant="caption" fontWeight={700} color="error.main">
                  Unsupported claims ({hc.unsupported_claims.length})
                </Typography>
              </Stack>
              <List dense disablePadding>
                {hc.unsupported_claims.map((claim, i) => (
                  <ListItem key={i} disablePadding sx={{ py: 0.25 }}>
                    <ListItemIcon sx={{ minWidth: 20 }}>
                      <Box
                        sx={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          bgcolor: 'error.main',
                          mt: '2px',
                        }}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                      primary={claim}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {/* Overall feedback */}
          {hc.overall_feedback && (
            <Box sx={{ bgcolor: 'background.paper', p: 1.5, borderRadius: 1.5 }}>
              <Typography variant="caption" color="text.secondary" fontStyle="italic">
                {hc.overall_feedback}
              </Typography>
            </Box>
          )}
        </Stack>
      </Paper>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      <Navbar />
      <Container maxWidth={false} sx={{ py: 4, px: { xs: 2, md: 4 }, maxWidth: 'none' }}>
        {/* ── Input form ── */}
        <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, border: 1, borderColor: 'divider', borderRadius: 3 }}>
          <Stack spacing={3}>
            <Stack spacing={0.5}>
              <Typography variant="h4" fontWeight={700}>
                Research Workspace
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Enter the companies, topics, and sources you want the assistant to analyse.
              </Typography>
            </Stack>

            {/* Competitors */}
            <Stack spacing={1.5}>
              <Typography variant="subtitle1" fontWeight={600}>
                Competitors
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <TextField
                  id="competitor-input"
                  fullWidth
                  size="small"
                  label="Add competitor"
                  value={competitorInput}
                  onChange={(e) => setCompetitorInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); addChip('competitor', competitorInput); }
                  }}
                />
                <Button variant="outlined" onClick={() => addChip('competitor', competitorInput)}>
                  Add
                </Button>
              </Stack>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {competitors.map((c) => (
                  <Chip key={c} label={c} onDelete={() => removeChip('competitor', c)} />
                ))}
              </Box>
            </Stack>

            {/* Topics */}
            <Stack spacing={1.5}>
              <Typography variant="subtitle1" fontWeight={600}>
                Topics
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <TextField
                  id="topic-input"
                  fullWidth
                  size="small"
                  label="Add topic"
                  value={topicInput}
                  onChange={(e) => setTopicInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); addChip('topic', topicInput); }
                  }}
                />
                <Button variant="outlined" onClick={() => addChip('topic', topicInput)}>
                  Add
                </Button>
              </Stack>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {topics.map((t) => (
                  <Chip key={t} label={t} onDelete={() => removeChip('topic', t)} />
                ))}
              </Box>
            </Stack>

            {/* URLs */}
            <Stack spacing={1.5}>
              <Typography variant="subtitle1" fontWeight={600}>
                Source URLs
              </Typography>
              {urls.map((url, i) => (
                <Stack key={i} direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                  <TextField
                    id={`url-input-${i}`}
                    fullWidth
                    size="small"
                    label={`Source URL ${i + 1}`}
                    value={url}
                    onChange={(e) => updateUrl(i, e.target.value)}
                    placeholder="https://example.com/article"
                  />
                  <Tooltip title="Remove URL">
                    <span>
                      <IconButton
                        id={`url-remove-${i}`}
                        onClick={() => removeUrlField(i)}
                        disabled={urls.length === 1}
                        aria-label="remove url"
                      >
                        <Delete />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Stack>
              ))}
              <Button
                id="add-url-btn"
                startIcon={<Add />}
                onClick={addUrlField}
                sx={{ alignSelf: 'flex-start' }}
              >
                Add URL
              </Button>
            </Stack>

            {/* Context */}
            <Stack spacing={1.5}>
              <Typography variant="subtitle1" fontWeight={600}>
                Additional context
              </Typography>
              <TextField
                id="context-input"
                multiline
                minRows={3}
                placeholder="Add any context that should shape the analysis, such as target region, product focus, or preferred output style."
                value={context}
                onChange={(e) => setContext(e.target.value)}
              />
            </Stack>

            <Button
              id="generate-report-btn"
              variant="contained"
              size="large"
              sx={{ alignSelf: 'flex-start', px: 4 }}
              onClick={handleGenerateReport}
              disabled={loading}
            >
              {loading ? <CircularProgress size={22} color="inherit" /> : 'Generate Report'}
            </Button>
          </Stack>

          {/* ── Loading progress stepper ── */}
          {loading && (
            <Box sx={{ mt: 4 }}>
              <Stepper activeStep={activeStep} alternativeLabel>
                {PIPELINE_STEPS.map((label, i) => (
                  <Step key={label} completed={i < activeStep}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
              <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
                {PIPELINE_STEPS[activeStep]} — this may take up to a minute for multiple URLs…
              </Typography>
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mt: 3 }}>
              {error}
            </Alert>
          )}

          {/* ── Report output ── */}
          {report && (
            <Paper variant="outlined" sx={{ mt: 4, p: { xs: 2, md: 3 }, borderRadius: 3 }}>
              <Stack spacing={3}>
                {/* Report header */}
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1}
                  alignItems={{ xs: 'flex-start', sm: 'center' }}
                  justifyContent="space-between"
                >
                  <Typography variant="h5" fontWeight={700}>
                    Market Intelligence Summary
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip icon={<Insights />} label="AI-generated report" color="primary" variant="outlined" />
                    <Button
                      id="download-pdf-btn"
                      variant="outlined"
                      startIcon={<Download />}
                      onClick={handleDownloadPdf}
                    >
                      Download PDF
                    </Button>
                  </Stack>
                </Stack>

                <Divider />

                {/* Executive summary */}
                {report.executiveSummary && (
                  <Box>
                    <SectionHeader>Executive summary</SectionHeader>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 2.5,
                        borderRadius: 3,
                        bgcolor: 'linear-gradient(135deg, rgba(25,118,210,0.06), rgba(147,51,234,0.04))',
                        borderColor: 'primary.light',
                      }}
                    >
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ lineHeight: 1.9, whiteSpace: 'pre-wrap' }}
                      >
                        {report.executiveSummary}
                      </Typography>
                    </Paper>
                  </Box>
                )}

                {/* Key themes */}
                {report.themes.length > 0 && (
                  <Box>
                    <SectionHeader>Key themes</SectionHeader>
                    <Stack spacing={1.5}>
                      {report.themes.map((theme, i) => (
                        <Paper
                          key={i}
                          variant="outlined"
                          sx={{ p: 2.5, borderRadius: 3, borderColor: 'divider' }}
                        >
                          <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                            {theme.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                            {theme.summary}
                          </Typography>
                          {theme.sources && theme.sources.filter(Boolean).length > 0 && (
                            <Stack direction="row" spacing={0.5} flexWrap="wrap" mt={1.5}>
                              {theme.sources.filter(Boolean).map((s, j) => (
                                <Chip
                                  key={j}
                                  size="small"
                                  icon={<LinkIcon fontSize="small" />}
                                  label={s.length > 40 ? `…${s.slice(-35)}` : s}
                                  component="a"
                                  href={s}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  clickable
                                  sx={{ fontSize: '0.65rem', maxWidth: 260 }}
                                />
                              ))}
                            </Stack>
                          )}
                        </Paper>
                      ))}
                    </Stack>
                  </Box>
                )}

                {/* Competitor activity */}
                {report.competitorActivities.length > 0 && (
                  <Box>
                    <SectionHeader>Competitor activity</SectionHeader>
                    <Stack spacing={1.5}>
                      {report.competitorActivities.map((item, i) => (
                        <Paper key={i} variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
                          <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                            {item.competitor}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                            {item.activity}
                          </Typography>
                          {item.sources && item.sources.filter(Boolean).length > 0 && (
                            <Stack direction="row" spacing={0.5} flexWrap="wrap" mt={1.5}>
                              {item.sources.filter(Boolean).map((s, j) => (
                                <Chip
                                  key={j}
                                  size="small"
                                  icon={<LinkIcon fontSize="small" />}
                                  label={s.length > 40 ? `…${s.slice(-35)}` : s}
                                  component="a"
                                  href={s}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  clickable
                                  sx={{ fontSize: '0.65rem', maxWidth: 260 }}
                                />
                              ))}
                            </Stack>
                          )}
                        </Paper>
                      ))}
                    </Stack>
                  </Box>
                )}

                <Divider />

                {/* Hallucination check */}
                <HallucinationPanel hc={report.hallucinationCheck} />
              </Stack>
            </Paper>
          )}
        </Paper>
      </Container>
    </Box>
  );
}

export default Dashboard;
