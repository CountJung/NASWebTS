import { Suspense } from 'react';
import FileExplorer from "@/components/FileExplorer/FileExplorer";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";

export default function RecentPage() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Recent Files
      </Typography>
      <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>}>
        <FileExplorer mode="recent" />
      </Suspense>
    </Box>
  );
}
