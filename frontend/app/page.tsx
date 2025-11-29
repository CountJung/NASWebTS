import FileExplorer from "@/components/FileExplorer/FileExplorer";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

export default function Home() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        File Explorer
      </Typography>
      <FileExplorer />
    </Box>
  );
}
