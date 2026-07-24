import { Download } from '@mui/icons-material';
import { Alert, Box, Button, Chip, CircularProgress, Container, Divider, List, ListItem, ListItemText, Paper, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import api from '../api';
import Navbar from '../components/Navbar';

const escapeHtml = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const getTextValue = (value) => typeof value === 'string' ? value : '';

const getHistorySummary = (item) => {
  const title = item?.title || item?.name || item?.executiveSummary || item?.executive_summary || 'Untitled report';
  const createdAt = item?.created_at || item?.createdAt || item?.generated_at || item?.generatedAt || 'Unknown date';
  const competitors = Array.isArray(item?.competitors)
    ? item.competitors
    : Array.isArray(item?.competitorActivities)
      ? item.competitorActivities.map((entry) => entry?.competitor || entry?.name || '').filter(Boolean)
      : [];
  const topics = Array.isArray(item?.topics)
    ? item.topics
    : Array.isArray(item?.themes)
      ? item.themes.map((entry) => entry?.title || entry?.name || '').filter(Boolean)
      : [];
  const sources = Array.isArray(item?.sources)
    ? item.sources
    : Array.isArray(item?.sourceTraceability)
      ? item.sourceTraceability.map((entry) => entry?.url || entry?.title || '').filter(Boolean)
      : [];
  const fallbackSummary = item?.summary || item?.executiveSummary || item?.executive_summary || 'Report generated successfully';
  const summaryText = getTextValue(fallbackSummary).replace(/\s+/g, ' ').trim();
  const summaryParts = summaryText.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [summaryText];
  const conciseSummary = summaryParts.slice(0, 2).join(' ').trim() || 'Report generated successfully';

  return {
    title,
    createdAt,
    summary: fallbackSummary,
    conciseSummary,
    competitors,
    topics,
    sources,
  };
};

function History() {
  const [historyItems, setHistoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await api.get('/api/history');
        setHistoryItems(response.data);
      } catch (err) {
        setError('Unable to load the history feed right now.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const handleDownloadPdf = (item) => {
    const summary = getHistorySummary(item);
    const printWindow = window.open('', '_blank', 'width=900,height=700');

    if (!printWindow) {
      setError('Please allow pop-ups to download the report as PDF.');
      return;
    }

    const competitors = summary.competitors.length ? summary.competitors : [];
    const topics = summary.topics.length ? summary.topics : [];
    const sources = summary.sources.length ? summary.sources : [];
    const fullSummary = escapeHtml(summary.summary || 'Report generated successfully');
    const competitorsMarkup = competitors.length
      ? competitors.map((value) => `<div class="item"><p>${escapeHtml(value)}</p></div>`).join('')
      : '<div class="item"><p>No competitors listed.</p></div>';
    const topicsMarkup = topics.length
      ? topics.map((value) => `<div class="item"><p>${escapeHtml(value)}</p></div>`).join('')
      : '<div class="item"><p>No main themes listed.</p></div>';
    const sourcesMarkup = sources.length
      ? sources.map((value) => `<div class="item"><p>${escapeHtml(value)}</p></div>`).join('')
      : '<div class="item"><p>No related sources listed.</p></div>';

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>${escapeHtml(summary.title)}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
            h1, h2 { margin-bottom: 8px; }
            .meta { color: #4b5563; margin-bottom: 20px; }
            .section { margin-top: 20px; }
            .item { border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px 12px; margin-bottom: 10px; }
            p { margin: 0; line-height: 1.5; }
          </style>
        </head>
        <body>
          <h1>${escapeHtml(summary.title)}</h1>
          <div class="meta">Generated: ${escapeHtml(summary.createdAt)}</div>
          <div class="section">
            <h2>Executive Summary</h2>
            <div class="item"><p>${fullSummary}</p></div>
          </div>
          <div class="section">
            <h2>Competitors</h2>
            ${competitorsMarkup}
          </div>
          <div class="section">
            <h2>Main Themes</h2>
            ${topicsMarkup}
          </div>
          <div class="section">
            <h2>Related Sources</h2>
            ${sourcesMarkup}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      <Navbar />
      <Container maxWidth={false} sx={{ py: 4, px: { xs: 2, md: 4 }, maxWidth: 'none' }}>
        <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, border: 1, borderColor: 'divider', borderRadius: 3 }}>
          <Stack spacing={2}>
            <Typography variant="h4" fontWeight={700}>History</Typography>
            <Typography variant="body1" color="text.secondary">
              Review your recent research runs and saved sources.
            </Typography>
            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress />
              </Box>
            )}
            {error && <Alert severity="error">{error}</Alert>}
            {!loading && !error && (
              <>
                {historyItems.length === 0 ? (
                  <Alert severity="info">No saved reports yet. Run a research analysis to populate this view.</Alert>
                ) : (
                  <List sx={{ bgcolor: 'grey.50', borderRadius: 2 }}>
                    {historyItems.map((item, index) => {
                      const summary = getHistorySummary(item);
                      const reportNumber = index + 1;

                      return (
                        <Box key={item.id || `${summary.title}-${index}`}>
                          <ListItem
                            alignItems="flex-start"
                            secondaryAction={
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Chip label="Completed" size="small" color="success" variant="outlined" />
                                <Button variant="outlined" size="small" startIcon={<Download />} onClick={() => handleDownloadPdf(item)}>
                                  PDF
                                </Button>
                              </Stack>
                            }
                          >
                            <ListItemText
                              primary={
                                <Stack spacing={0.5}>
                                  <Typography variant="body1" fontWeight={700}>
                                    Report {reportNumber}:
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    Generated: {summary.createdAt}
                                  </Typography>
                                </Stack>
                              }
                              secondary={
                                <Stack spacing={1.25} sx={{ mt: 1 }}>
                                  <Box>
                                    <Typography variant="body2" fontWeight={700}>Summary</Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                                      {summary.conciseSummary.length > 140 ? `${summary.conciseSummary.slice(0, 140)}...` : summary.conciseSummary}
                                    </Typography>
                                  </Box>
                                  <Box>
                                    <Typography variant="body2" fontWeight={700}>Competitors</Typography>
                                    {summary.competitors.length > 0 ? (
                                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 0.25 }}>
                                        {summary.competitors.slice(0, 5).map((competitor) => (
                                          <Chip key={competitor} label={competitor} size="small" variant="outlined" color="primary" />
                                        ))}
                                      </Stack>
                                    ) : (
                                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>No competitors listed.</Typography>
                                    )}
                                  </Box>
                                  <Box>
                                    <Typography variant="body2" fontWeight={700}>Main Themes</Typography>
                                    {summary.topics.length > 0 ? (
                                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 0.25 }}>
                                        {summary.topics.slice(0, 5).map((topic) => (
                                          <Chip key={topic} label={topic} size="small" variant="outlined" color="secondary" />
                                        ))}
                                      </Stack>
                                    ) : (
                                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>No main themes listed.</Typography>
                                    )}
                                  </Box>
                                  <Box>
                                    <Typography variant="body2" fontWeight={700}>Related Sources</Typography>
                                    {summary.sources.length > 0 ? (
                                      <ul style={{ margin: '6px 0 0 18px', padding: 0 }}>
                                        {summary.sources.slice(0, 5).map((source) => (
                                          <li key={source}><Typography variant="body2" color="text.secondary">{source}</Typography></li>
                                        ))}
                                      </ul>
                                    ) : (
                                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>No related sources listed.</Typography>
                                    )}
                                  </Box>
                                </Stack>
                              }
                            />
                          </ListItem>
                          {index < historyItems.length - 1 && <Divider />}
                        </Box>
                      );
                    })}
                  </List>
                )}
              </>
            )}
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}

export default History;
