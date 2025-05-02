import React, { useState, useEffect } from "react";
import Web3 from "web3";
import PatientRegistration from "../build/contracts/PatientRegistration.json";
import NavBar_Logout from "./NavBar_Logout";
import DoctorViewPatient from "./DoctorViewPatient"; // Import the DoctorViewPatient component

function ViewPatientList() {
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
  const [patients, setPatients] = useState([]);
  const [error, setError] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null); // State to track the selected patient

  useEffect(() => {
    const init = async () => {
      try {
        if (window.ethereum) {
          const web3Instance = new Web3(window.ethereum);
          setWeb3(web3Instance);

          const networkId = await web3Instance.eth.net.getId();
          const deployedNetwork = PatientRegistration.networks[networkId];
          const contractInstance = new web3Instance.eth.Contract(
            PatientRegistration.abi,
            deployedNetwork && deployedNetwork.address
          );
          setContract(contractInstance);

          // Fetch the list of patients
          const patientList = await contractInstance.methods.getAllPatients().call();
          setPatients(patientList);
        } else {
          setError("Please install MetaMask extension");
        }
      } catch (err) {
        console.error("Error initializing contract or fetching patients:", err);
        setError("Error initializing contract or fetching patients");
      }
    };

    init();
  }, []);

  const handleView = (hhNumber) => {
    // Update the URL to the desired structure
    window.history.pushState({}, "", `/doctor/${hhNumber}/DoctorViewPatient`);

    // Set the selected patient to render the DoctorViewPatient component
    setSelectedPatient(hhNumber);
  };

  const handleRemove = async (hhNumber) => {
    try {
      if (!contract) {
        setError("Contract is not initialized");
        return;
      }

      const accounts = await web3.eth.getAccounts();
      await contract.methods.removePatient(hhNumber).send({ from: accounts[0] });

      // Update the patient list in the frontend
      setPatients((prevPatients) => prevPatients.filter((p) => p.hhNumber !== hhNumber));
      console.log(`Removed patient with HH Number: ${hhNumber}`);
    } catch (err) {
      console.error("Error removing patient:", err);
      setError("Error removing patient");
    }
  };

  // If a patient is selected, render the DoctorViewPatient component
  if (selectedPatient) {
    return <DoctorViewPatient hhNumber={selectedPatient} />;
  }

  return (
    <div>
      <NavBar_Logout />
      <div className="bg-gradient-to-b from-black to-gray-800 text-white p-10 font-mono">
        <h1 className="text-center text-3xl mb-6">Patient List</h1>
        {error && <p className="text-red-500 text-center">{error}</p>}
        {patients.length > 0 ? (
          <div className="space-y-4">
            {patients.map((patient, index) => (
              <div
                key={index}
                className="border border-gray-600 p-4 rounded-lg shadow-md bg-gray-700"
              >
                <p className="text-lg font-bold">Patient: {index + 1}</p>
                <p className="text-lg">Name: {patient.name}</p>
                <div className="flex space-x-4 mt-4">
                  <button
                    onClick={() => handleView(patient.hhNumber)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleRemove(patient.hhNumber)}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-xl">No patients found.</p>
        )}
      </div>
    </div>
  );
}

export default ViewPatientList;
