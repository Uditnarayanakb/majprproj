import React, { useState, useEffect } from "react";
import Web3 from "web3";
import PatientRegistration from "../build/contracts/PatientRegistration.json";
import NavBar_Logout from "./NavBar_Logout";

function DoctorViewPatient({ hhNumber }) {
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
  const [patientDetails, setPatientDetails] = useState(null);
  const [error, setError] = useState(null);

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

          // Fetch patient details
          const details = await contractInstance.methods.getPatientDetails(hhNumber).call();
          setPatientDetails(details);
        } else {
          setError("Please install MetaMask extension");
        }
      } catch (err) {
        console.error("Error fetching patient details:", err);
        setError("Error fetching patient details");
      }
    };

    init();
  }, [hhNumber]);

  return (
    <div>
      <NavBar_Logout />
      <div className="bg-gradient-to-b from-black to-gray-800 text-white p-10 font-mono">
        <h1 className="text-center text-4xl font-bold mb-8">Patient Details</h1>
        {error && <p className="text-red-500 text-center">{error}</p>}
        {patientDetails ? (
          <div className="border border-gray-600 p-8 rounded-lg shadow-md bg-gray-700">
            <div className="grid grid-cols-2 gap-4">
              <p className="text-2xl">
                <strong>Name:</strong>{" "}
                <span className="text-yellow-500">{patientDetails.name}</span>
              </p>
              <p className="text-2xl">
                <strong>Date of Birth:</strong>{" "}
                <span className="text-yellow-500">{patientDetails.dateOfBirth}</span>
              </p>
              <p className="text-2xl">
                <strong>Gender:</strong>{" "}
                <span className="text-yellow-500">{patientDetails.gender}</span>
              </p>
              <p className="text-2xl">
                <strong>Blood Group:</strong>{" "}
                <span className="text-yellow-500">{patientDetails.bloodGroup}</span>
              </p>
              <p className="text-2xl">
                <strong>Address:</strong>{" "}
                <span className="text-yellow-500">{patientDetails.homeAddress}</span>
              </p>
              <p className="text-2xl">
                <strong>Email:</strong>{" "}
                <span className="text-yellow-500">{patientDetails.email}</span>
              </p>
            </div>
            <div className="flex justify-center space-x-6 mt-8">
              <button
                className="px-6 py-3 bg-teal-500 hover-bg-gray-600 text-white rounded-lg focus:outline-none focus:ring focus:ring-teal-400 transition duration-300"
                onClick={() => console.log("View Record clicked")}
              >
                View Record
              </button>
              <button
                className="px-6 py-3 bg-teal-500 hover-bg-gray-600 text-white rounded-lg focus:outline-none focus:ring focus:ring-teal-400 transition duration-300"
                onClick={() => console.log("Prescription Consultancy clicked")}
              >
                Prescription Consultancy
              </button>
              <button
                className="px-6 py-3 bg-teal-500 hover-bg-gray-600 text-white rounded-lg focus:outline-none focus:ring focus:ring-teal-400 transition duration-300"
                onClick={() => window.location.reload()} // Close and reload the page
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <p className="text-center text-2xl">Loading patient details...</p>
        )}
      </div>
    </div>
  );
}

export default DoctorViewPatient;