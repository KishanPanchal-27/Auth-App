import { Typography, Box, Button, Link } from "@mui/material";

export default function Home() {
  return (
    <Box sx={{ mt: 3, m: 4 }}>
      <Typography variant="h4" gutterBottom>
        Welcome to Auth System
      </Typography>

      <Box sx={{ display: "flex", gap: 2, mt: 4 }}>
        <Button
          variant="contained"
          href="/customer-register"
          sx={{
            transition: "0.3s",
            "&:hover": {
              backgroundColor: "#1565c0",
              color: "white",
            },
          }}
        >
          Register as Customer
        </Button>

        <Button
          variant="contained"
          href="/admin-register"
          sx={{
            transition: "0.3s",
            "&:hover": {
              backgroundColor: "#1565c0",

              color: "white",
            },
          }}
        >
          Register as Admin
        </Button>

        <Button
          variant="contained"
          href="/admin-login"
          sx={{
            transition: "0.3s",
            "&:hover": {
              color: "white",
              backgroundColor: "#1565c0",
            },
          }}
        >
          Admin Login
        </Button>
      </Box>
    </Box>
  );
}
