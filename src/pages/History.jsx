import { Download } from '@mui/icons-material';
import { Alert, Box, Button, Chip, CircularProgress, Container, Divider, List, ListItem, ListItemText, Paper, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import api from '../api';
import Navbar from '../components/Navbar';

const getHistorySummary = (item) => {
  const title = item?.title || item?.name || 'Untitled report';
  const createdAt = item?.created_at || item?.createdAt || item?.generated_at || item?.generatedAt || 'Unknown date';
  const competitors = Array.isArray(item?.competitors) ? item.competitors : [];
  const topics = Array.isArray(item?.topics) ? item.topics : [];
  const sourceCount = Array.isArray(item?.sources) ? item.sources.length : 0;
  const summaryParts = [];

  if (competitors.length) {
    summaryParts.push(`${competitors.length} competitor${competitors.length > 1 ? 's' : ''}`);
  }

  if (topics.length) {
    summaryParts.push(`${topics.length} topic${topics.length > 1 ? 's' : ''}`);
  }

  if (sourceCount) {
    summaryParts.push(`${sourceCount} source${sourceCount > 1 ? 's' : ''}`);
  }

  return {
    title,
    createdAt,
    summary: summaryParts.join(' · ') || 'Report generated successfully',
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

    const competitors = Array.isArray(item?.competitors) ? item.competitors : [];
    const topics = Array.isArray(item?.topics) ? item.topics : [];
    const sources = Array.isArray(item?.sources) ? item.sources : [];

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>${summary.title}</title>
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
          <h1>${summary.title}</h1>
          <div class="meta">Generated: ${summary.createdAt}</div>
          <div class="section">
            <h2>Summary</h2>
            <div class="item"><p>${summary.summary}</p></div>
          </div>
          <div class="section">
            <h2>Competitors</h2>
            ${competitors.map((value) => `<div class="item"><p>${value}</p></div>`).join('')}
          </div>
          <div class="section">
            <h2>Topics</h2>
            ${topics.map((value) => `<div class="item"><p>${value}</p></div>`).join('')}
          </div>
          <div class="section">
            <h2>Sources</h2>
            ${sources.map((value) => `<div class="item"><p>${value}</p></div>`).join('')}
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
              <List sx={{ bgcolor: 'grey.50', borderRadius: 2 }}>
                {historyItems.map((item, index) => {
                  const summary = getHistorySummary(item);

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
                          primary={summary.title}
                          secondary={
                            <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                              <Typography variant="body2" color="text.secondary">
                                Generated: {summary.createdAt}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {summary.summary}
                              </Typography>
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
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}

export default History;
