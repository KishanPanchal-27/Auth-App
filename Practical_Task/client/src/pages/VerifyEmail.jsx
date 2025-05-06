import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Container,
  Button,
} from "@mui/material";
import axios from "axios";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState({
    loading: true,
    message: "",
    error: "",
  });
  const navigate = useNavigate();
  const token = searchParams.get("token");

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const response = await axios.post(
          "http://localhost:5000/api/verify-email",
          { token }
        );
        setStatus({
          loading: false,
          message: response.data.message,
          error: "",
        });
      } catch (error) {
        setStatus({
          loading: false,
          message: "",
          error: error.response?.data?.message || "Email verification failed",
        });
      }
    };

    if (token) {
      verifyToken();
    } else {
      setStatus({
        loading: false,
        message: "",
        error: "No verification token provided",
      });
    }
  }, [token]);

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          textAlign: "center",
        }}
      >
        {status.loading ? (
          <>
            <CircularProgress size={60} />
            <Typography variant="body1" sx={{ mt: 2 }}>
              Verifying your email...
            </Typography>
          </>
        ) : status.error ? (
          <Alert severity="error" sx={{ width: "100%", mb: 2 }}>
            {status.error}
          </Alert>
        ) : (
          <>
            <Alert severity="success" sx={{ width: "100%", mb: 2 }}>
              {status.message || "Your email has been successfully verified!"}
            </Alert>
            <Button variant="contained" onClick={() => navigate("/")}>
              Go to Login
            </Button>
          </>
        )}
      </Box>
    </Container>
  );
}
