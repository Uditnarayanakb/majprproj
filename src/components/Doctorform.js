import React, { useState, useEffect } from "react";
import Web3 from "web3";
import PatientRegistration from "../build/contracts/PatientRegistration.json";
import NavBar_Logout from "./NavBar_Logout";
import { useParams, useNavigate } from "react-router-dom";

const Doctorform = () => {
  const { hhNumber } = useParams();
  const navigate = useNavigate();
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
  const [patientDetails, setPatientDetails] = useState({});
  const [doctorAddress, setDoctorAddress] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [prescription, setPrescription] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    const init = async () => {
      if (window.ethereum) {
        const web3Instance = new Web3(window.ethereum);
        setWeb3(web3Instance);

        // Get doctor wallet address
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        setDoctorAddress(accounts[0]);

        // Get contract
        const networkId = await web3Instance.eth.net.getId();
        const deployedNetwork = PatientRegistration.networks[networkId];
        const contractInstance = new web3Instance.eth.Contract(
          PatientRegistration.abi,
          deployedNetwork && deployedNetwork.address
        );
        setContract(contractInstance);

        // Fetch patient details
        try {
          const details = await contractInstance.methods.getPatientDetails(hhNumber).call();
          setPatientDetails(details);
        } catch (err) {
          setError("Error fetching patient details");
        }
      } else {
        setError("Please install MetaMask extension");
      }
    };
    init();
  }, [hhNumber]);

  const handleCreateRecord = async (e) => {
    e.preventDefault();
    if (!contract) return;
    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const accounts = await web3.eth.getAccounts();
      const sender = accounts[0];

      // Use addPatientRecord to store diagnosis and prescription
      await contract.methods.addPatientRecord(
        hhNumber, // string
        new Date().toISOString().slice(0, 10), // string (date)
        `Diagnosis: ${diagnosis}\nPrescription: ${prescription}`, // string (description)
        doctorAddress, // string (doctor wallet)
        "" // string (IPFS hash, empty for text-only)
      ).send({ from: sender, gas: 200000 });

      alert("Prescription record created!");
      navigate(-1);
    } catch (err) {
      setError("Error creating prescription record");
      console.error(err);
    }
  };

  return (
    <div>
      <NavBar_Logout />
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-black to-gray-800 font-mono">
        <div className="bg-gray-900 p-8 rounded-lg shadow-lg w-full max-w-lg mt-10">
          <h2 className="text-3xl font-bold text-center mb-8 text-white">Consultancy</h2>
          {error && <p className="text-red-500 text-center mb-4">{error}</p>}
          <form onSubmit={handleCreateRecord} className="w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-4">
                <div>
                  <label className="block text-white font-semibold mb-1">Doctor Wallet Address:</label>
                  <div className="bg-gray-700 text-yellow-400 px-3 py-2 rounded break-all">{doctorAddress || "Loading..."}</div>
                </div>

                <div>
                  <label className="block text-white font-semibold mb-1">Patient Name:</label>
                  <div className="bg-gray-700 text-yellow-400 px-3 py-2 rounded">{patientDetails.name || "Loading..."}</div>
                </div>
                <div>
                  <label className="block text-white font-semibold mb-1">Gender:</label>
                  <div className="bg-gray-700 text-yellow-400 px-3 py-2 rounded">{patientDetails.gender || "Loading..."}</div>
                </div>
              </div>
              {/* Right Column */}
              <div className="space-y-4">
                <div>
                  <label className="block text-white font-semibold mb-1">Diagnosis:</label>
                  <textarea
                    className="w-full px-3 py-2 rounded bg-gray-700 text-white min-h-[80px]"
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-white font-semibold mb-1">Prescription:</label>
                  <textarea
                    className="w-full px-3 py-2 rounded bg-gray-700 text-white min-h-[80px]"
                    value={prescription}
                    onChange={(e) => setPrescription(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-between mt-8">
              <button
                type="submit"
                className="px-6 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition duration-300"
              >
                Create Record
              </button>
              <button
                type="button"
                className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition duration-300"
                onClick={() => window.location.href = `/doctor/${hhNumber}/DoctorViewPatient`}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Doctorform;
