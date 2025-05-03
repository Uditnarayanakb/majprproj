import React, { useState, useEffect } from "react";
import Web3 from "web3";
import PatientRegistration from "../build/contracts/PatientRegistration.json";
import NavBar_Logout from "./NavBar_Logout";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function DiagnosticForm() {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [patientDetails, setPatientDetails] = useState({});
  const [patientWallet, setPatientWallet] = useState("");
  const [diagnosticWallet, setDiagnosticWallet] = useState("");
  const [reportFile, setReportFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Fetch patients from contract
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        if (window.ethereum) {
          const web3 = new Web3(window.ethereum);
          await window.ethereum.request({ method: "eth_requestAccounts" });
          const networkId = await web3.eth.net.getId();
          const deployedNetwork = PatientRegistration.networks[networkId];
          if (!deployedNetwork) {
            setError("Smart contract not deployed on this network.");
            setLoading(false);
            return;
          }
          const contract = new web3.eth.Contract(
            PatientRegistration.abi,
            deployedNetwork.address
          );

          // Fetch patients only
          const patientList = await contract.methods.getAllPatients().call();

          setPatients(
            patientList.map((pat, idx) => ({
              name: pat.name,
              id: pat.hhNumber || idx.toString(),
              dateOfBirth: pat.dateOfBirth || "",
              gender: pat.gender || "",
              bloodGroup: pat.bloodGroup || "",
              walletAddress: pat.walletAddress || "",
            }))
          );
        } else {
          setError("Please install MetaMask.");
        }
      } catch (err) {
        setError("Error fetching data from blockchain.");
        console.error(err);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  // Auto-fill patient details when selected
  useEffect(() => {
    if (selectedPatient) {
      const patient = patients.find((p) => p.id === selectedPatient);
      setPatientDetails(patient || {});
      setPatientWallet(patient?.walletAddress || "");
    } else {
      setPatientDetails({});
      setPatientWallet("");
    }
  }, [selectedPatient, patients]);

  // Get diagnostic wallet address
  useEffect(() => {
    const getWallet = async () => {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        setDiagnosticWallet(accounts[0]);
      }
    };
    getWallet();
  }, []);

  const handleFileChange = (e) => {
    setReportFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!reportFile) {
      setError("Please select a file to upload.");
      return;
    }
    try {
      // 1. Upload file to Pinata IPFS
      const formData = new FormData();
      formData.append("file", reportFile);

      const res = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formData, {
        maxBodyLength: "Infinity",
        headers: {
          "Content-Type": "multipart/form-data",
          pinata_api_key: process.env.REACT_APP_PINATA_API_KEY,
          pinata_secret_api_key: process.env.REACT_APP_PINATA_API_SECRET, // <-- use _API_SECRET here
        },
      });

      const ipfsHash = res.data.IpfsHash;

      // 2. Send transaction to smart contract
      const web3 = new Web3(window.ethereum);
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = PatientRegistration.networks[networkId];
      const contract = new web3.eth.Contract(
        PatientRegistration.abi,
        deployedNetwork.address
      );
      const accounts = await web3.eth.getAccounts();

      // You may need to adjust the arguments based on your contract
      await contract.methods
        .addPatientRecord(
          patientDetails.id, // hhNumber
          new Date().toISOString().slice(0, 10), // date
          "Diagnostic Report", // description
          diagnosticWallet, // doctor/diagnostic wallet
          ipfsHash // IPFS hash
        )
        .send({ from: accounts[0] });

      alert("Report uploaded and transaction successful!");

      // Reset form state
      setSelectedPatient("");
      setPatientDetails({});
      setPatientWallet("");
      setReportFile(null);

      // Optionally, reset file input value if needed
      // document.getElementById("fileInput").value = "";

      // Navigate back
      navigate(-1);
    } catch (err) {
      setError("Error uploading report: " + (err?.response?.data?.error?.message || err.message));
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white bg-black">
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <div>
      <NavBar_Logout />
      <div className="bg-gradient-to-b from-black to-gray-800 text-white p-10 font-mono min-h-screen flex flex-col items-center">
        <form
          className="bg-gray-900 p-8 rounded-lg shadow-lg w-full max-w-2xl"
          onSubmit={handleSubmit}
        >
          {error && <div className="text-red-400 mb-4 text-center">{error}</div>}
          {/* Two Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-white font-semibold mb-1">Patient Name:</label>
                <select
                  className="w-full px-3 py-2 rounded bg-gray-700 text-white"
                  value={selectedPatient}
                  onChange={(e) => setSelectedPatient(e.target.value)}
                  required
                >
                  <option value="">Select Patient</option>
                  {patients.map((pat) => (
                    <option key={pat.id} value={pat.id}>{pat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-white font-semibold mb-1">Date of Birth:</label>
                <input
                  className="w-full px-3 py-2 rounded bg-gray-700 text-white"
                  value={patientDetails.dateOfBirth || ""}
                  readOnly
                />
              </div>
              <div>
                <label className="block text-white font-semibold mb-1">Gender:</label>
                <input
                  className="w-full px-3 py-2 rounded bg-gray-700 text-white"
                  value={patientDetails.gender || ""}
                  readOnly
                />
              </div>
              <div>
                <label className="block text-white font-semibold mb-1">Blood Group:</label>
                <input
                  className="w-full px-3 py-2 rounded bg-gray-700 text-white"
                  value={patientDetails.bloodGroup || ""}
                  readOnly
                />
              </div>
            </div>
            {/* Right Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-white font-semibold mb-1">Patient Wallet Address:</label>
                <input
                  className="w-full px-3 py-2 rounded bg-gray-700 text-white"
                  value={patientWallet}
                  onChange={(e) => setPatientWallet(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-white font-semibold mb-1">Diagnostics Wallet Address:</label>
                <input
                  className="w-full px-3 py-2 rounded bg-gray-700 text-white"
                  value={diagnosticWallet}
                  required
                  readOnly
                />
              </div>
            </div>
          </div>
          {/* Upload and Buttons */}
          <div className="mb-6">
            <label className="block text-white font-semibold mb-1">Upload Final Report:</label>
            <input
              type="file"
              className="w-full text-white"
              onChange={handleFileChange}
              required
            />
          </div>
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <button
              type="submit"
              className="w-full md:w-auto px-6 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition duration-300"
            >
              Submit Report
            </button>
            <button
              type="button"
              className="w-full md:w-auto px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition duration-300"
              onClick={() => navigate(-1)}
            >
              Back
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default DiagnosticForm;
