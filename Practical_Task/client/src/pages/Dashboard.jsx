import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import axios from "axios";

export default function Dashboard() {
  const [customers, setCustomers] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/customers",
          {
            withCredentials: true,
          }
        );
        setCustomers(response.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch customers");
        if (err.response?.status === 401) {
          navigate("/admin-login");
        }
      }
    };
    fetchCustomers();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await axios.post(
        "http://localhost:5000/api/logout",
        {},
        { withCredentials: true }
      );
      navigate("/admin-login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <Box sx={{ p: 4, m: 4 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 4 }}>
        <Typography variant="h4">Customer List</Typography>
      </Box>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>First Name</TableCell>
              <TableCell>Last Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {customers.map((customer) => (
              <TableRow key={customer._id}>
                <TableCell>{customer.firstName}</TableCell>
                <TableCell>{customer.lastName}</TableCell>
                <TableCell>{customer.email}</TableCell>
                <TableCell>{customer.role}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Button
        variant="contained"
        color="error"
        onClick={handleLogout}
        sx={{ ml: 2, mt: 2 }}
      >
        Logout
      </Button>
      <Button
        variant="contained"
        color="error"
        onClick={() => navigate("/")}
        sx={{ ml: 2, mt: 2 }}
      >
        Home
      </Button>
    </Box>
  );
}
